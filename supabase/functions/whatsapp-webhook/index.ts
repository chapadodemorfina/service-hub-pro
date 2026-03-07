import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { phone, message, provider_message_id, message_type = "text" } = body;

    if (!phone || !message) {
      return jsonResponse({ error: "phone and message are required" }, 400);
    }

    const normalizedPhone = normalizePhone(phone);

    // 1. Get or create conversation
    const conversation = await getOrCreateConversation(supabase, normalizedPhone);

    // 2. Store inbound message
    const { data: inboundMsg } = await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      direction: "inbound",
      message_type,
      provider_message_id,
      text_content: message,
    }).select().single();

    // Update last_message_at
    await supabase.from("whatsapp_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    // 3. Check handoff state — if waiting_human or human_active, don't process with bot
    if (conversation.status === "waiting_human" || conversation.status === "human_active") {
      return jsonResponse({
        conversation_id: conversation.id,
        status: conversation.status,
        response: null,
        note: "Conversation is in handoff mode. Message stored for human attendant.",
      });
    }

    // 4. Identify customer if not yet linked
    let customerId = conversation.customer_id;
    let customerName = conversation.metadata?.customer_name || null;

    if (!customerId) {
      const { data: lookupResult } = await supabase.rpc("wa_lookup_customer", { _phone: normalizedPhone });
      if (lookupResult?.count === 1) {
        const cust = lookupResult.customers[0];
        customerId = cust.id;
        customerName = cust.full_name;
        await supabase.from("whatsapp_conversations")
          .update({ customer_id: customerId, metadata: { customer_name: customerName } })
          .eq("id", conversation.id);
      } else if (lookupResult?.count > 1) {
        const responseText = "Encontramos mais de um cadastro para esse número. Por favor, informe seu CPF ou número da OS para que possamos identificá-lo(a).";
        await storeOutbound(supabase, conversation.id, responseText);
        return jsonResponse({ conversation_id: conversation.id, response: responseText, customer_status: "ambiguous" });
      }
    }

    // 5. Classify intent and generate response via AI
    let responseText: string;
    let intent = "unknown_intent";
    let confidence = 0;

    if (!customerId) {
      // Unknown customer
      intent = "unknown_customer";
      responseText = "Olá! Não conseguimos identificar seu cadastro. Por favor, informe seu CPF, ou o número da sua ordem de serviço, ou entre em contato pelo telefone da loja para atendimento.";
      await logAiAction(supabase, conversation.id, inboundMsg?.id, "customer_identification", { phone: normalizedPhone }, { found: false }, false);
    } else if (!lovableApiKey) {
      // No AI key - simple fallback
      responseText = "Olá! Nosso assistente está temporariamente indisponível. Um atendente entrará em contato em breve.";
      await createHandoff(supabase, conversation.id, "ai_unavailable");
    } else {
      // Gather business context
      const context = await gatherBusinessContext(supabase, customerId);

      // Classify intent and get response
      const aiResult = await classifyAndRespond(lovableApiKey, message, customerName || "Cliente", context, conversation.id);
      intent = aiResult.intent;
      confidence = aiResult.confidence;
      responseText = aiResult.response;

      // Execute actions if needed
      if (aiResult.action) {
        const actionResult = await executeAction(supabase, aiResult.action, customerId, context, conversation.id, inboundMsg?.id);
        if (actionResult.response) {
          responseText = actionResult.response;
        }
      }

      // Check if escalation needed
      if (intent === "ask_for_human" || confidence < 0.4) {
        await createHandoff(supabase, conversation.id, intent === "ask_for_human" ? "customer_request" : "low_confidence");
        if (intent === "ask_for_human") {
          responseText = "Entendido! Estou encaminhando você para um atendente humano. Por favor, aguarde um momento. 🙏";
        }
      }

      await logAiAction(supabase, conversation.id, inboundMsg?.id, "intent_classification", { message, intent, confidence }, { response: responseText.substring(0, 200) }, true);
    }

    // Update inbound message with intent
    await supabase.from("whatsapp_messages").update({ intent, confidence }).eq("id", inboundMsg?.id);

    // 6. Store outbound message
    await storeOutbound(supabase, conversation.id, responseText);

    // 7. Send via provider (or dev-safe fallback)
    const sendResult = await sendWhatsAppMessage(normalizedPhone, responseText);

    return jsonResponse({
      conversation_id: conversation.id,
      customer_id: customerId,
      intent,
      confidence,
      response: responseText,
      delivery: sendResult,
    });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// ---- Helpers ----

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "").replace(/^\+?55/, "55");
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getOrCreateConversation(supabase: any, phone: string) {
  // Find active conversation
  const { data: existing } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("phone", phone)
    .in("status", ["active", "bot_active", "waiting_human", "human_active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  // Create new
  const { data: newConv } = await supabase
    .from("whatsapp_conversations")
    .insert({ phone, status: "bot_active" })
    .select()
    .single();

  return newConv;
}

async function storeOutbound(supabase: any, conversationId: string, text: string) {
  await supabase.from("whatsapp_messages").insert({
    conversation_id: conversationId,
    direction: "outbound",
    message_type: "text",
    text_content: text,
  });
}

async function logAiAction(supabase: any, convId: string, msgId: string | null, actionType: string, actionPayload: any, resultPayload: any, success: boolean) {
  await supabase.from("whatsapp_ai_actions").insert({
    conversation_id: convId,
    message_id: msgId,
    action_type: actionType,
    action_payload: actionPayload,
    result_payload: resultPayload,
    success,
  });
}

async function createHandoff(supabase: any, convId: string, reason: string) {
  // Check if there's already an active handoff
  const { data: existing } = await supabase
    .from("whatsapp_handoffs")
    .select("id")
    .eq("conversation_id", convId)
    .in("status", ["pending", "assigned", "active"])
    .limit(1);

  if (existing?.length > 0) return;

  await supabase.from("whatsapp_handoffs").insert({
    conversation_id: convId,
    requested_by: "customer",
    reason,
    status: "pending",
  });

  await supabase.from("whatsapp_conversations")
    .update({ status: "waiting_human", current_handoff_state: "pending" })
    .eq("id", convId);
}

async function gatherBusinessContext(supabase: any, customerId: string) {
  const [orders, quotes, balance, warranties, logistics] = await Promise.all([
    supabase.rpc("wa_get_customer_orders", { _customer_id: customerId }),
    supabase.rpc("wa_get_customer_quotes", { _customer_id: customerId }),
    supabase.rpc("wa_get_customer_balance", { _customer_id: customerId }),
    supabase.rpc("wa_get_customer_warranties", { _customer_id: customerId }),
    supabase.rpc("wa_get_customer_logistics", { _customer_id: customerId }),
  ]);

  return {
    orders: orders.data || [],
    quotes: quotes.data || [],
    balance: balance.data || {},
    warranties: warranties.data || [],
    logistics: logistics.data || [],
  };
}

const STATUS_LABELS: Record<string, string> = {
  received: "Recebido", triage: "Triagem", awaiting_diagnosis: "Aguardando Diagnóstico",
  awaiting_quote: "Aguardando Orçamento", awaiting_customer_approval: "Aguardando Aprovação",
  awaiting_parts: "Aguardando Peças", in_repair: "Em Reparo", in_testing: "Em Teste",
  ready_for_pickup: "Pronto p/ Retirada", delivered: "Entregue", cancelled: "Cancelado",
  warranty_return: "Retorno Garantia",
};

async function classifyAndRespond(apiKey: string, message: string, customerName: string, context: any, conversationId: string) {
  const systemPrompt = `Você é o assistente virtual da i9 Solution, uma assistência técnica de eletrônicos.
Seu objetivo é ajudar clientes a consultar informações sobre seus serviços de forma clara e objetiva.

REGRAS ABSOLUTAS:
- Responda APENAS com dados fornecidos no contexto. NUNCA invente informações.
- Mantenha respostas curtas (máximo 3 parágrafos).
- Use linguagem cordial e profissional em português brasileiro.
- Se não tiver certeza, sugira falar com um atendente.
- NUNCA revele informações internas, custos, margens ou notas internas.
- Para aprovação de orçamento, SEMPRE peça confirmação explícita.

STATUS LABELS: ${JSON.stringify(STATUS_LABELS)}

CONTEXTO DO CLIENTE (${customerName}):
Ordens de serviço: ${JSON.stringify(context.orders)}
Orçamentos: ${JSON.stringify(context.quotes)}
Saldo financeiro: ${JSON.stringify(context.balance)}
Garantias: ${JSON.stringify(context.warranties)}
Logística: ${JSON.stringify(context.logistics)}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_intent",
            description: "Classify the customer intent and generate a response",
            parameters: {
              type: "object",
              properties: {
                intent: {
                  type: "string",
                  enum: [
                    "check_service_order_status", "check_ready_for_pickup", "check_delivery_status",
                    "check_device_info", "check_quote_status", "check_quote_amount",
                    "approve_quote", "reject_quote", "check_open_balance", "check_payment_status",
                    "check_pickup_status", "check_warranty_status", "request_warranty_return",
                    "greeting", "ask_for_human", "unknown_intent"
                  ],
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                response: { type: "string", description: "The response to send to the customer in Portuguese" },
                action: {
                  type: "string",
                  enum: ["approve_quote", "reject_quote", "request_handoff", "none"],
                  description: "Action to execute, if any"
                },
                action_data: {
                  type: "object",
                  description: "Data needed for the action, e.g. quote_id",
                  properties: { quote_id: { type: "string" } },
                },
              },
              required: ["intent", "confidence", "response"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify_intent" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return { intent: "unknown_intent", confidence: 0, response: "Nosso assistente está temporariamente sobrecarregado. Tente novamente em alguns instantes ou peça para falar com um atendente.", action: null };
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return {
        intent: parsed.intent || "unknown_intent",
        confidence: parsed.confidence || 0.5,
        response: parsed.response || "Desculpe, não entendi. Poderia reformular?",
        action: parsed.action !== "none" ? parsed.action : null,
        actionData: parsed.action_data || null,
      };
    }

    // Fallback: use content directly
    const content = data.choices?.[0]?.message?.content;
    return { intent: "unknown_intent", confidence: 0.5, response: content || "Desculpe, não consegui processar sua mensagem. Deseja falar com um atendente?", action: null };
  } catch (err) {
    console.error("AI classification error:", err);
    return { intent: "unknown_intent", confidence: 0, response: "Tivemos um problema ao processar sua mensagem. Um atendente poderá ajudá-lo(a). Deseja ser transferido?", action: null };
  }
}

async function executeAction(supabase: any, action: string, customerId: string, context: any, convId: string, msgId: string | null) {
  if (action === "approve_quote" || action === "reject_quote") {
    // Find the latest sent quote
    const sentQuote = (context.quotes || []).find((q: any) => q.status === "sent");
    if (!sentQuote) {
      return { response: "Não encontramos um orçamento pendente de aprovação no seu cadastro." };
    }

    // For approval, require explicit confirmation (handled by AI flow - two-step)
    const decision = action === "approve_quote" ? "approved" : "rejected";

    try {
      const { data: result, error } = await supabase.rpc("approve_reject_quote", {
        _quote_id: sentQuote.id,
        _decision: decision,
        _decided_by_name: "WhatsApp",
        _decided_by_role: "customer",
        _reason: `Via WhatsApp conversacional`,
      });

      if (error) throw error;

      await logAiAction(supabase, convId, msgId, action, { quote_id: sentQuote.id, decision }, result, true);

      if (decision === "approved") {
        return { response: `✅ Orçamento ${sentQuote.quote_number} no valor de R$ ${Number(sentQuote.total_amount).toFixed(2)} aprovado com sucesso! Daremos andamento ao reparo.` };
      } else {
        return { response: `Orçamento ${sentQuote.quote_number} foi recusado. Entraremos em contato sobre os próximos passos.` };
      }
    } catch (err: any) {
      await logAiAction(supabase, convId, msgId, action, { quote_id: sentQuote.id }, { error: err.message }, false);
      return { response: "Houve um erro ao processar a aprovação. Por favor, tente novamente ou entre em contato pelo portal." };
    }
  }

  if (action === "request_handoff") {
    await createHandoff(supabase, convId, "customer_request_via_ai");
    return { response: "Estou transferindo para um atendente humano. Por favor, aguarde. 🙏" };
  }

  return {};
}

async function sendWhatsAppMessage(phone: string, message: string) {
  const apiKey = Deno.env.get("WHATSAPP_API_KEY");
  const apiUrl = Deno.env.get("WHATSAPP_API_URL");

  if (!apiKey || !apiUrl) {
    console.log(`[DEV] WhatsApp message to ${phone}: ${message.substring(0, 100)}...`);
    return { sent: false, reason: "whatsapp_provider_not_configured", mode: "dev_fallback" };
  }

  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ to: phone, message }),
    });
    const data = await resp.json().catch(() => ({}));
    return { sent: resp.ok, status: resp.status, provider_response: data };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}
