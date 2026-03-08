
DO $$
DECLARE
  _first_names text[] := ARRAY['João','Maria','Carlos','Fernanda','Ricardo','Ana','Pedro','Juliana','Lucas','Camila','Rafael','Beatriz','André','Patrícia','Bruno','Larissa','Diego','Mariana','Felipe','Gabriela','Thiago','Amanda','Gustavo','Isabela','Rodrigo','Carolina','Leonardo','Letícia','Marcelo','Daniela','Matheus','Aline','Vinícius','Natália','Eduardo','Raquel','Fernando','Vanessa','Alexandre','Cristiane','Henrique','Priscila','Renato','Tatiana','Sérgio','Monique','Paulo','Helena','Roberto','Sandra','Daniel','Cláudia','Fábio','Luciana','Marcos','Adriana','Wagner','Michele','José','Simone','Leandro','Eliane','Antônio','Rosana','Márcio','Karina','Rogério','Débora','Cássio','Viviane','Caio','Érica','Tiago','Carla','Igor','Bianca','Danilo','Regina','Nilton','Francisca'];
  _last_names text[] := ARRAY['Silva','Santos','Oliveira','Costa','Alves','Souza','Lima','Ferreira','Pereira','Rodrigues','Gomes','Martins','Araujo','Barbosa','Ribeiro','Carvalho','Nascimento','Mendes','Cardoso','Rocha','Moreira','Lopes','Nunes','Teixeira','Freitas','Monteiro','Vieira','Fonseca','Campos','Moura','Pinto','Castro','Duarte','Correia','Reis','Melo','Dias','Cavalcanti','Pires','Ramos'];
  _cities text[] := ARRAY['São Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre','Salvador','Recife','Fortaleza','Brasília','Goiânia','Campinas','Santos','Florianópolis','Natal','Manaus'];
  _device_types text[] := ARRAY['notebook','smartphone','desktop_pc','monitor','tv','tablet'];
  _brands text[][] := ARRAY[
    ARRAY['Dell','Lenovo','HP','Asus','Acer','Apple'],
    ARRAY['Samsung','Apple','Xiaomi','Motorola','LG','Realme'],
    ARRAY['Dell','HP','Lenovo','Positivo','Asus','Custom'],
    ARRAY['Dell','LG','Samsung','AOC','Philips','BenQ'],
    ARRAY['Samsung','LG','Sony','TCL','Philips','AOC'],
    ARRAY['Samsung','Apple','Xiaomi','Lenovo','Huawei','Amazon']
  ];
  _models text[][] := ARRAY[
    ARRAY['Inspiron 15','IdeaPad 3','Pavilion 15','Vivobook','Aspire 5','MacBook Air'],
    ARRAY['Galaxy S23','iPhone 14','Redmi Note 12','Moto G73','K61','GT Neo 3'],
    ARRAY['OptiPlex 3000','ProDesk 400','ThinkCentre','Master D','ExpertCenter','PC Gamer'],
    ARRAY['P2422H','27MK430H','F24T350','24B1H','243V7','GW2480'],
    ARRAY['Crystal UHD 55','NanoCell 50','X80K 55','S5400A 43','50PUG7408','32S5195'],
    ARRAY['Tab S8','iPad 10','Pad 5','Tab M10','MatePad','Fire HD 10']
  ];
  _colors text[] := ARRAY['Preto','Prata','Branco','Cinza','Azul','Vermelho','Dourado','Rosa'];
  _issues text[] := ARRAY['Não liga','Tela quebrada','Bateria não carrega','Superaquecimento','Teclado não funciona','Danos por água','Sem imagem','Desliga sozinho','Lentidão extrema','Sem som','Tela piscando','Wi-Fi não conecta','Porta USB danificada','Carregador não funciona','Botão power quebrado','Tela com manchas','Memória insuficiente','HD fazendo barulho','Ventilador barulhento','Placa de vídeo com defeito'];
  _fault_types text[] := ARRAY['Curto na placa-mãe','Falha na bateria','LCD danificado','IC de carga queimado','Falha no SSD','Conector solto','Capacitor estourado','Flex danificado','Chip gráfico com defeito','Memória RAM defeituosa','Sensor de temperatura falho','Placa Wi-Fi queimada','Porta de carga oxidada','Cristal líquido vazando','Cooler travado'];
  _part_names text[] := ARRAY['Tela LCD 15.6"','Bateria iPhone','Porta HDMI','IC de Carga','SSD 256GB','RAM 8GB DDR4','Kit Capacitores','Porta USB-C','Tela AMOLED 6.5"','Flex de Carga','Conector DC','Cooler CPU','Pasta Térmica','Bateria Notebook','Placa Wi-Fi','Cabo Flat Teclado','Tela LCD 14"','SSD 512GB','RAM 16GB DDR4','HD 1TB','Fonte ATX 500W','Conector Lightning','Touch Screen 10"','Backlight LED','Placa Mãe Notebook','Tela LCD 24"','Inverter Board','Cabo LVDS','Conector Micro USB','Bateria Tablet','Alto-falante','Microfone','Câmera Frontal','Câmera Traseira','Sensor Proximidade','Vibracall','Botão Power Flex','Bandeja SIM','Antena NFC','Módulo GPS'];
  _part_costs numeric[] := ARRAY[180,65,25,45,150,120,15,35,220,20,18,40,12,180,55,28,160,250,200,180,120,30,85,35,450,200,75,22,15,90,18,12,45,65,20,10,15,8,12,15];

  _customer_ids uuid[];
  _device_ids uuid[];
  _device_customer_map uuid[];
  _cp_ids uuid[];
  _supplier_ids uuid[];
  _product_ids uuid[];
  _so_ids uuid[];
  _so_statuses text[];
  _so_customer_map uuid[];
  _so_cp_map uuid[];

  _id uuid; _cust_id uuid; _dev_id uuid; _dev_type_idx int; _brand_idx int;
  _cp_id uuid; _so_id uuid; _diag_id uuid; _quote_id uuid; _fe_id uuid; _prod_id uuid;
  _i int; _j int; _status text; _amount numeric; _prev_status text; _created_at timestamptz;
  _existing_user_id uuid := '4177c9bc-9b1f-4078-ba30-eeabef7e9796';
  _comm_pct numeric;

  _status_flow text[] := ARRAY['received','triage','awaiting_diagnosis','awaiting_quote','awaiting_customer_approval','in_repair','awaiting_parts','in_repair','in_testing','ready_for_pickup','delivered'];
  _target_statuses text[] := ARRAY[
    'received','received','received','received','received','received','received','received','received','received',
    'received','received','received','received','received','received','received','received','received','received',
    'awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis',
    'awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis',
    'awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis','awaiting_diagnosis',
    'awaiting_quote','awaiting_quote','awaiting_quote','awaiting_quote','awaiting_quote',
    'awaiting_quote','awaiting_quote','awaiting_quote','awaiting_quote','awaiting_quote',
    'awaiting_customer_approval','awaiting_customer_approval','awaiting_customer_approval','awaiting_customer_approval','awaiting_customer_approval',
    'awaiting_parts','awaiting_parts','awaiting_parts','awaiting_parts','awaiting_parts',
    'awaiting_parts','awaiting_parts','awaiting_parts','awaiting_parts','awaiting_parts',
    'in_repair','in_repair','in_repair','in_repair','in_repair',
    'in_repair','in_repair','in_repair','in_repair','in_repair',
    'in_testing','in_testing','in_testing','in_testing','in_testing',
    'in_testing','in_testing','in_testing','in_testing','in_testing',
    'ready_for_pickup','ready_for_pickup','ready_for_pickup','ready_for_pickup','ready_for_pickup',
    'delivered','delivered','delivered','delivered','delivered',
    'delivered','delivered','delivered','delivered','delivered',
    'delivered','delivered','delivered','delivered','delivered'
  ];
  _priorities text[] := ARRAY['normal','normal','normal','normal','high','high','low','urgent'];
  _channels text[] := ARRAY['front_desk','front_desk','front_desk','collection_point','whatsapp','phone'];
  _cp_names text[] := ARRAY['Loja Tech Centro','Cell Express','InfoPoint Assistência','Mobile Center','ConsertaTech','Help Eletrônicos'];
  _cp_persons text[] := ARRAY['Roberto Lima','Sandra Ferreira','Paulo Mendes','Helena Rocha','Marcos Vieira','Adriana Campos'];
  _cp_commissions numeric[] := ARRAY[12, 15, 10, 18, 14, 20];
  _supp_names text[] := ARRAY['DistParts Brasil','TechSupply','Componentes Express','MegaParts','ImportTech'];
BEGIN
  -- 1. CUSTOMERS (80)
  _customer_ids := ARRAY[]::uuid[];
  FOR _i IN 1..80 LOOP
    _id := gen_random_uuid();
    INSERT INTO customers (id, type, full_name, document, phone, whatsapp, email, is_active, created_by, created_at)
    VALUES (_id, CASE WHEN _i % 5 = 0 THEN 'business'::customer_type ELSE 'individual'::customer_type END,
      _first_names[_i] || ' ' || _last_names[((_i * 7 + 3) % 40) + 1],
      lpad((100+_i)::text,3,'0')||'.'||lpad((200+_i*3)::text,3,'0')||'.'||lpad((300+_i*2)::text,3,'0')||'-'||lpad((_i%100)::text,2,'0'),
      '(11) 9'||lpad((8000+_i*97)::text,4,'0')||'-'||lpad((1000+_i*53)::text,4,'0'),
      '(11) 9'||lpad((8000+_i*97)::text,4,'0')||'-'||lpad((1000+_i*53)::text,4,'0'),
      lower(replace(_first_names[_i],' ',''))||'.'||lower(_last_names[((_i*7+3)%40)+1])||_i||'@email.com',
      true, _existing_user_id, now()-(interval '1 day'*(90-_i)));
    _customer_ids := array_append(_customer_ids, _id);
    IF _i <= 40 THEN
      INSERT INTO customer_addresses (customer_id, label, street, number, neighborhood, city, state, zip_code, is_default)
      VALUES (_id,'Principal','Rua '||_last_names[((_i*3)%40)+1],(_i*17%999+1)::text,'Centro',_cities[(_i%15)+1],'SP',
        lpad((_i*1234%99999)::text,5,'0')||'-'||lpad((_i*7%999)::text,3,'0'),true);
    END IF;
  END LOOP;

  -- 2. COLLECTION POINTS (6)
  _cp_ids := ARRAY[]::uuid[];
  FOR _i IN 1..6 LOOP
    _id := gen_random_uuid();
    INSERT INTO collection_points (id,name,responsible_person,phone,email,street,number,city,state,commission_type,commission_value,is_active,created_by)
    VALUES (_id,_cp_names[_i],_cp_persons[_i],
      '(11) 3'||lpad((200+_i*111)::text,4,'0')||'-'||lpad((1000+_i*333)::text,4,'0'),
      lower(replace(_cp_names[_i],' ',''))||'@email.com','Av. '||_last_names[_i],(_i*123)::text,_cities[_i],'SP',
      'percentage',_cp_commissions[_i],true,_existing_user_id);
    _cp_ids := array_append(_cp_ids, _id);
  END LOOP;

  -- 3. SUPPLIERS (5) + PRODUCTS (40)
  _supplier_ids := ARRAY[]::uuid[];
  FOR _i IN 1..5 LOOP
    _id := gen_random_uuid();
    INSERT INTO suppliers (id,name,contact_name,phone,email,is_active,created_by)
    VALUES (_id,_supp_names[_i],'Contato '||_supp_names[_i],'(11) 4'||lpad((_i*444)::text,4,'0')||'-0000',
      lower(replace(_supp_names[_i],' ',''))||'@fornecedor.com',true,_existing_user_id);
    _supplier_ids := array_append(_supplier_ids, _id);
  END LOOP;

  _product_ids := ARRAY[]::uuid[];
  FOR _i IN 1..40 LOOP
    _id := gen_random_uuid();
    INSERT INTO products (id,sku,name,category,cost_price,sale_price,quantity,minimum_quantity,supplier_id,is_active,created_by)
    VALUES (_id,'SKU-'||lpad(_i::text,4,'0'),_part_names[_i],
      CASE WHEN _i<=4 THEN 'Tela / Display' WHEN _i<=8 THEN 'Conector / Porta' WHEN _i<=12 THEN 'Bateria'
        WHEN _i<=16 THEN 'Armazenamento' WHEN _i<=20 THEN 'Memória RAM' WHEN _i<=24 THEN 'Placa-mãe'
        WHEN _i<=28 THEN 'Cooler / Ventoinha' WHEN _i<=32 THEN 'Cabo / Flex' ELSE 'Outro' END,
      _part_costs[_i],round(_part_costs[_i]*1.8,2),(20+(_i*7%80)),
      CASE WHEN _part_costs[_i]>100 THEN 5 ELSE 10 END,
      _supplier_ids[((_i-1)%5)+1],true,_existing_user_id);
    _product_ids := array_append(_product_ids, _id);
    INSERT INTO stock_movements (product_id,movement_type,quantity,previous_quantity,new_quantity,unit_cost,notes,created_by)
    VALUES (_id,'entry',(20+(_i*7%80)),0,(20+(_i*7%80)),_part_costs[_i],'Estoque inicial',_existing_user_id);
  END LOOP;

  -- 4. DEVICES (120)
  _device_ids := ARRAY[]::uuid[];
  _device_customer_map := ARRAY[]::uuid[];
  FOR _i IN 1..120 LOOP
    _id := gen_random_uuid();
    _cust_id := _customer_ids[((_i-1)%80)+1];
    _dev_type_idx := ((_i-1)%6)+1;
    _brand_idx := ((_i*3)%6)+1;
    INSERT INTO devices (id,customer_id,device_type,brand,model,serial_number,color,reported_issue,is_active,created_by,created_at)
    VALUES (_id,_cust_id,_device_types[_dev_type_idx]::device_type,
      _brands[_dev_type_idx][_brand_idx],_models[_dev_type_idx][_brand_idx],
      'SN-'||upper(substring(md5(_i::text) from 1 for 10)),
      _colors[((_i*5)%8)+1],_issues[((_i-1)%20)+1],
      true,_existing_user_id,now()-(interval '1 day'*(90-_i*0.7)));
    _device_ids := array_append(_device_ids, _id);
    _device_customer_map := array_append(_device_customer_map, _cust_id);
  END LOOP;

  -- 5. SERVICE ORDERS (100)
  _so_ids := ARRAY[]::uuid[];
  _so_statuses := ARRAY[]::text[];
  _so_customer_map := ARRAY[]::uuid[];
  _so_cp_map := ARRAY[]::uuid[];
  FOR _i IN 1..100 LOOP
    _id := gen_random_uuid();
    _dev_id := _device_ids[_i];
    _cust_id := _device_customer_map[_i];
    _status := _target_statuses[_i];
    _created_at := now()-(interval '1 day'*(60-_i*0.55));
    IF _channels[((_i-1)%6)+1] = 'collection_point' OR (_i%3=0) THEN
      _cp_id := _cp_ids[((_i-1)%6)+1];
    ELSE _cp_id := NULL;
    END IF;

    INSERT INTO service_orders (id,customer_id,device_id,status,priority,intake_channel,collection_point_id,
      reported_issue,assigned_technician_id,created_by,created_at,updated_at,expected_deadline)
    VALUES (_id,_cust_id,_dev_id,_status::service_order_status,
      _priorities[((_i-1)%8)+1]::service_order_priority,
      _channels[((_i-1)%6)+1]::intake_channel,_cp_id,
      _issues[((_i-1)%20)+1],_existing_user_id,_existing_user_id,
      _created_at,_created_at+(interval '1 hour'*(_i*2)),
      _created_at + interval '7 days');

    _so_ids := array_append(_so_ids, _id);
    _so_statuses := array_append(_so_statuses, _status);
    _so_customer_map := array_append(_so_customer_map, _cust_id);
    _so_cp_map := array_append(_so_cp_map, _cp_id);

    -- Status history
    INSERT INTO service_order_status_history (service_order_id,from_status,to_status,changed_by,created_at,notes)
    VALUES (_id,NULL,'received',_existing_user_id,_created_at,'Dispositivo recebido');
    _prev_status := 'received';
    FOR _j IN 2..array_length(_status_flow,1) LOOP
      EXIT WHEN _status_flow[_j]=_status OR _prev_status=_status;
      IF _status_flow[_j]<>_prev_status THEN
        INSERT INTO service_order_status_history (service_order_id,from_status,to_status,changed_by,created_at)
        VALUES (_id,_prev_status::service_order_status,_status_flow[_j]::service_order_status,_existing_user_id,_created_at+(interval '2 hours'*_j));
        _prev_status := _status_flow[_j];
      END IF;
    END LOOP;
    IF _status<>'received' AND _status<>_prev_status THEN
      INSERT INTO service_order_status_history (service_order_id,from_status,to_status,changed_by,created_at)
      VALUES (_id,_prev_status::service_order_status,_status::service_order_status,_existing_user_id,_created_at+interval '24 hours');
    END IF;
  END LOOP;

  -- 6. DIAGNOSTICS (60 diagnoses for orders 21..80)
  FOR _i IN 21..80 LOOP
    _so_id := _so_ids[_i]; _diag_id := gen_random_uuid();
    _created_at := now()-(interval '1 day'*(50-_i*0.45));
    INSERT INTO diagnostics (id,service_order_id,diagnosis_status,probable_cause,technical_findings,repair_complexity,repair_viability,estimated_cost,estimated_repair_hours,diagnosed_by,diagnosis_started_at,diagnosis_completed_at,created_at)
    VALUES (_diag_id,_so_id,CASE WHEN _i<=30 THEN 'in_progress' ELSE 'completed' END::diagnosis_status,
      _fault_types[((_i-1)%15)+1],'Análise: '||_fault_types[((_i-1)%15)+1],
      CASE _i%4 WHEN 0 THEN 'simple' WHEN 1 THEN 'moderate' WHEN 2 THEN 'complex' ELSE 'specialized' END::repair_complexity,
      CASE WHEN _i%10=0 THEN 'not_repairable' ELSE 'repairable' END::repair_viability,
      (120+(_i*13%780))::numeric,(1+(_i%8))::numeric,_existing_user_id,_created_at,
      CASE WHEN _i>30 THEN _created_at+interval '4 hours' ELSE NULL END,_created_at);
    INSERT INTO diagnosis_faults (diagnosis_id,fault_type,fault_description,severity,confirmed)
    VALUES (_diag_id,_fault_types[((_i-1)%15)+1],'Defeito: '||_fault_types[((_i-1)%15)+1],
      CASE _i%4 WHEN 0 THEN 'minor' WHEN 1 THEN 'moderate' WHEN 2 THEN 'severe' ELSE 'critical' END::fault_severity,true);
    INSERT INTO diagnosis_tests (diagnosis_id,test_name,test_result,test_category,sort_order) VALUES
      (_diag_id,'Teste de energia',CASE WHEN _i%3=0 THEN 'fail' ELSE 'pass' END::test_result,'Energia',1),
      (_diag_id,'Teste de display',CASE WHEN _i%4=0 THEN 'fail' ELSE 'pass' END::test_result,'Vídeo',2);
    INSERT INTO diagnosis_parts (diagnosis_id,product_id,part_name,quantity,estimated_unit_cost)
    VALUES (_diag_id,_product_ids[((_i-1)%40)+1],_part_names[((_i-1)%40)+1],1,_part_costs[((_i-1)%40)+1]);
  END LOOP;

  -- 7. QUOTES (50 for orders 36..85)
  FOR _i IN 36..85 LOOP
    _so_id := _so_ids[_i]; _quote_id := gen_random_uuid();
    _amount := (120+(_i*17%780))::numeric;
    _created_at := now()-(interval '1 day'*(40-(_i-36)*0.7));
    INSERT INTO repair_quotes (id,service_order_id,status,total_amount,analysis_fee,notes,created_by,created_at)
    VALUES (_quote_id,_so_id,
      CASE WHEN _i<=65 THEN 'approved' WHEN _i<=75 THEN 'rejected' ELSE 'sent' END::quote_status,
      _amount,round(_amount*0.1,2),'Orçamento para reparo',_existing_user_id,_created_at);
    INSERT INTO repair_quote_items (quote_id,item_type,description,quantity,unit_price,total_price,sort_order) VALUES
      (_quote_id,'labor','Mão de obra',1,round(_amount*0.4,2),round(_amount*0.4,2),1),
      (_quote_id,'part',_part_names[((_i-1)%40)+1],1,round(_amount*0.6,2),round(_amount*0.6,2),2);
    IF _i<=75 THEN
      INSERT INTO quote_approvals (quote_id,decision,decided_by_name,decided_by_role,reason,created_at)
      VALUES (_quote_id,CASE WHEN _i<=65 THEN 'approved' ELSE 'rejected' END::quote_status,
        'Cliente','customer',CASE WHEN _i<=65 THEN 'Aprovado' ELSE 'Valor alto' END,_created_at+interval '1 day');
    END IF;
  END LOOP;

  -- 8. FINANCIAL ENTRIES
  FOR _i IN 36..65 LOOP
    _so_id := _so_ids[_i]; _amount := (120+(_i*17%780))::numeric;
    _fe_id := gen_random_uuid(); _created_at := now()-(interval '1 day'*(35-(_i-36)*0.9));
    INSERT INTO financial_entries (id,entry_type,description,amount,paid_amount,status,service_order_id,customer_id,category,created_by,created_at)
    VALUES (_fe_id,'revenue','Serviço de reparo',_amount,
      CASE WHEN _i<=50 THEN _amount WHEN _i<=58 THEN round(_amount*0.5,2) ELSE 0 END,
      CASE WHEN _i<=50 THEN 'paid' WHEN _i<=58 THEN 'partial' ELSE 'pending' END::financial_entry_status,
      _so_id,_so_customer_map[_i],'service',_existing_user_id,_created_at);
    IF _i<=58 THEN
      INSERT INTO payments (financial_entry_id,amount,payment_method,payment_date,created_by)
      VALUES (_fe_id,CASE WHEN _i<=50 THEN _amount ELSE round(_amount*0.5,2) END,
        CASE _i%4 WHEN 0 THEN 'pix' WHEN 1 THEN 'credit_card' WHEN 2 THEN 'debit_card' ELSE 'cash' END::payment_method,
        _created_at+interval '2 days',_existing_user_id);
    END IF;
  END LOOP;
  FOR _i IN 1..15 LOOP
    INSERT INTO financial_entries (entry_type,description,amount,paid_amount,status,category,created_by,created_at)
    VALUES ('expense',CASE _i%3 WHEN 0 THEN 'Compra de peças' WHEN 1 THEN 'Aluguel' ELSE 'Materiais' END,
      (200+_i*50)::numeric,(200+_i*50)::numeric,'paid',
      CASE _i%3 WHEN 0 THEN 'parts' WHEN 1 THEN 'rent' ELSE 'supplies' END,
      _existing_user_id,now()-(interval '1 day'*(_i*5)));
  END LOOP;

  -- 9. COMMISSIONS
  FOR _i IN 1..100 LOOP
    IF _so_cp_map[_i] IS NOT NULL AND _so_statuses[_i] IN ('delivered','ready_for_pickup','in_testing','in_repair') THEN
      _amount := (120+(_i*17%780))::numeric;
      SELECT commission_value INTO _comm_pct FROM collection_points WHERE id=_so_cp_map[_i];
      IF _comm_pct IS NULL THEN _comm_pct:=15; END IF;
      INSERT INTO collection_point_commissions (collection_point_id,service_order_id,commission_type,commission_value,base_amount,calculated_amount,is_paid,paid_at)
      VALUES (_so_cp_map[_i],_so_ids[_i],'percentage',_comm_pct,_amount,round(_amount*_comm_pct/100,2),
        _so_statuses[_i]='delivered',CASE WHEN _so_statuses[_i]='delivered' THEN now()-interval '2 days' ELSE NULL END);
      IF _so_statuses[_i]='delivered' THEN
        INSERT INTO financial_entries (entry_type,description,amount,paid_amount,status,service_order_id,collection_point_id,category,created_by)
        VALUES ('commission','Comissão parceiro',round(_amount*_comm_pct/100,2),round(_amount*_comm_pct/100,2),
          'paid',_so_ids[_i],_so_cp_map[_i],'commission',_existing_user_id);
      END IF;
    END IF;
  END LOOP;

  -- 10. PARTS USED (orders 61..80)
  FOR _i IN 61..80 LOOP
    _so_id := _so_ids[_i]; _prod_id := _product_ids[((_i-1)%40)+1];
    INSERT INTO repair_parts_used (service_order_id,product_id,quantity,unit_cost,unit_price,total_cost,total_price,consumed_by)
    VALUES (_so_id,_prod_id,1,_part_costs[((_i-1)%40)+1],round(_part_costs[((_i-1)%40)+1]*1.8,2),
      _part_costs[((_i-1)%40)+1],round(_part_costs[((_i-1)%40)+1]*1.8,2),_existing_user_id);
    INSERT INTO stock_movements (product_id,movement_type,quantity,previous_quantity,new_quantity,reference_type,reference_id,created_by)
    VALUES (_prod_id,'consumed',-1,(SELECT quantity FROM products WHERE id=_prod_id),
      (SELECT quantity-1 FROM products WHERE id=_prod_id),'service_order',_so_id,_existing_user_id);
    UPDATE products SET quantity=quantity-1 WHERE id=_prod_id AND quantity>0;
  END LOOP;

  -- 11. PUBLIC TRACKING LINKS (50)
  FOR _i IN 1..50 LOOP
    INSERT INTO service_order_public_links (service_order_id,public_token,status,created_by)
    VALUES (_so_ids[_i],encode(gen_random_bytes(24),'hex'),'active',_existing_user_id);
  END LOOP;

  -- 12. LOGISTICS (20)
  FOR _i IN 1..20 LOOP
    INSERT INTO pickups_deliveries (service_order_id,logistics_type,status,contact_name,contact_phone,address_street,address_city,address_state,driver_name,scheduled_date,created_by)
    VALUES (_so_ids[_i],CASE WHEN _i<=10 THEN 'pickup' ELSE 'delivery' END::logistics_type,
      CASE _i%4 WHEN 0 THEN 'picked_up' WHEN 1 THEN 'in_transport' WHEN 2 THEN 'received_at_lab' ELSE 'pickup_requested' END::logistics_status,
      _first_names[_i]||' '||_last_names[_i],'(11) 99999-'||lpad((_i*111)::text,4,'0'),
      'Rua '||_last_names[_i+10],_cities[(_i%15)+1],'SP','Motorista '||_i,
      (now()+interval '2 days'),_existing_user_id);
  END LOOP;

  -- 13. TRANSFERS
  FOR _i IN 1..100 LOOP
    IF _so_cp_map[_i] IS NOT NULL THEN
      INSERT INTO collection_transfers (service_order_id,collection_point_id,direction,status,transferred_at)
      VALUES (_so_ids[_i],_so_cp_map[_i],'to_center',
        CASE WHEN _so_statuses[_i] IN ('received','triage') THEN 'pending_pickup'
          WHEN _so_statuses[_i]='awaiting_diagnosis' THEN 'in_transit_to_center'
          ELSE 'received_at_center' END::transfer_status,
        now()-(interval '1 day'*(30-_i*0.3)));
    END IF;
  END LOOP;
END;
$$;
