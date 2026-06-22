do $$
declare
  v_function_oid regprocedure;
  v_definition text;
  v_updated_definition text;
begin
  foreach v_function_oid in array array[
    'public.verify_daily_goal_transaction(text,text,boolean)'::regprocedure,
    'public.perform_care_action_transaction(text,text)'::regprocedure
  ]
  loop
    select pg_get_functiondef(v_function_oid)
    into v_definition;

    if position('v_today text :=' in v_definition) > 0 then
      continue;
    end if;

    v_updated_definition := replace(
      v_definition,
      'v_today date := (now() at time zone ''Asia/Singapore'')::date;',
      'v_today text := to_char(now() at time zone ''Asia/Singapore'', ''YYYY-MM-DD'');'
    );

    if v_updated_definition = v_definition then
      raise exception 'Could not locate the expected v_today date declaration in function %.',
        v_function_oid;
    end if;

    execute v_updated_definition;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
