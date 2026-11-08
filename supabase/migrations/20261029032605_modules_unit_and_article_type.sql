-- Articles (le, la, un, une) get their own word type, and modules are grouped into units (levels) on the map.
-- Adding an enum value can't share a transaction with rows that use it, so the content comes in the next migration.
alter type public.word_type add value if not exists 'Article';

alter table public.modules
  add column unit smallint not null default 1 check (unit >= 1);

comment on column public.modules.unit is 'The unit (level) the module belongs to on the level map, from 1.';
