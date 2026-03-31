alter table organizations
  alter column system_prompt set default 'Та бол компанийн албан ёсны AI туслах.';

update organizations
set system_prompt = 'Та бол компанийн албан ёсны AI туслах.'
where system_prompt is null or btrim(system_prompt) = '';
