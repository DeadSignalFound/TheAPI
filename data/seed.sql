INSERT INTO series (slug, name) VALUES
  ('murder-drones', 'Murder Drones'),
  ('sunset-showdown', 'Sunset Showdown'),
  ('future-series', 'Future Series');

INSERT INTO quotes (series_id, speaker, quote_text) VALUES
  ((SELECT id FROM series WHERE slug = 'murder-drones'), 'Uzi', 'Bite me!'),
  ((SELECT id FROM series WHERE slug = 'murder-drones'), 'N', 'I am so unbelievably sorry.'),
  ((SELECT id FROM series WHERE slug = 'murder-drones'), 'J', 'Corporate says they sent us to deal with this quietly.');
