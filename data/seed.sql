INSERT INTO series (slug, name) VALUES
  ('murder-drones', 'Murder Drones'),
  ('sunset-showdown', 'Sunset Showdown'),
  ('future-series', 'Future Series')
ON CONFLICT(slug) DO NOTHING;
