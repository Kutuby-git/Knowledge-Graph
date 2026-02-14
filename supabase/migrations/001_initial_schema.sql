-- Quranic Arabic Knowledge Graph - Initial Schema
-- 768 unique words across 15 thematic units

-- Enable pgvector for embedding storage
create extension if not exists vector;

-- ============================================
-- CORE TABLES
-- ============================================

-- 15 thematic units (A through O)
create table units (
  id serial primary key,
  code char(1) not null unique,
  name text not null,
  full_name text not null,
  description text,
  color text not null,
  icon text,
  display_order int not null,
  created_at timestamptz default now()
);

-- Sub-themes within each unit (~130 total)
create table sub_themes (
  id serial primary key,
  unit_id int not null references units(id) on delete cascade,
  theme_order numeric not null,
  label text not null,
  display_order int not null default 0,
  created_at timestamptz default now(),
  unique(unit_id, theme_order)
);

-- Arabic trilateral roots (populated in Phase 3)
create table roots (
  id serial primary key,
  letters text not null unique,
  transliteration text,
  meaning text,
  created_at timestamptz default now()
);

-- 768 unique Quranic Arabic words
create table words (
  id serial primary key,
  arabic text not null,
  arabic_bare text not null unique,
  transliteration text,
  kids_glossary text,
  surah_ayah text,
  is_advanced boolean default false,
  part_2 boolean default false,
  root_id int references roots(id) on delete set null,
  difficulty_score smallint check (difficulty_score between 1 and 5),
  difficulty_factors jsonb,
  part_of_speech text,
  morphological_form text,
  embedding vector(384),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Many-to-many: words <-> sub_themes (988 associations - this IS the graph)
create table word_themes (
  id serial primary key,
  word_id int not null references words(id) on delete cascade,
  sub_theme_id int not null references sub_themes(id) on delete cascade,
  source_sheet text,
  row_number int,
  unique(word_id, sub_theme_id)
);

-- Typed relationship edges between words
create table word_relationships (
  id serial primary key,
  word_id_1 int not null references words(id) on delete cascade,
  word_id_2 int not null references words(id) on delete cascade,
  relationship_type text not null check (relationship_type in (
    'same_root', 'opposite', 'virtue_pair', 'semantic_similar', 'morphological_variant'
  )),
  weight real not null default 0.5,
  metadata jsonb,
  created_at timestamptz default now(),
  unique(word_id_1, word_id_2, relationship_type)
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_sub_themes_unit on sub_themes(unit_id);
create index idx_words_root on words(root_id);
create index idx_words_difficulty on words(difficulty_score);
create index idx_word_themes_word on word_themes(word_id);
create index idx_word_themes_sub_theme on word_themes(sub_theme_id);
create index idx_word_relationships_word1 on word_relationships(word_id_1);
create index idx_word_relationships_word2 on word_relationships(word_id_2);
create index idx_word_relationships_type on word_relationships(relationship_type);

-- Full-text search index
create index idx_words_fts on words using gin(
  to_tsvector('simple', coalesce(arabic, '') || ' ' || coalesce(transliteration, '') || ' ' || coalesce(kids_glossary, ''))
);

-- Vector similarity search (HNSW for fast approximate nearest neighbor)
create index idx_words_embedding on words using hnsw (embedding vector_cosine_ops);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Search words by text (Arabic, transliteration, or English)
create or replace function search_words(query_text text)
returns setof words
language sql stable
as $$
  select *
  from words
  where
    arabic ilike '%' || query_text || '%'
    or arabic_bare ilike '%' || query_text || '%'
    or transliteration ilike '%' || query_text || '%'
    or kids_glossary ilike '%' || query_text || '%'
  order by
    case
      when arabic = query_text or arabic_bare = query_text then 0
      when arabic ilike query_text || '%' then 1
      when transliteration ilike query_text || '%' then 2
      when kids_glossary ilike query_text || '%' then 3
      else 4
    end
  limit 50;
$$;

-- Get all connections for a word
create or replace function get_word_connections(target_word_id int)
returns table(
  word_id int,
  arabic text,
  transliteration text,
  kids_glossary text,
  relationship_type text,
  weight real
)
language sql stable
as $$
  select
    w.id as word_id,
    w.arabic,
    w.transliteration,
    w.kids_glossary,
    wr.relationship_type,
    wr.weight
  from word_relationships wr
  join words w on w.id = case
    when wr.word_id_1 = target_word_id then wr.word_id_2
    else wr.word_id_1
  end
  where wr.word_id_1 = target_word_id or wr.word_id_2 = target_word_id
  order by wr.weight desc;
$$;

-- Get words in the same themes as the target word
create or replace function get_theme_siblings(target_word_id int)
returns table(
  word_id int,
  arabic text,
  transliteration text,
  kids_glossary text,
  shared_theme text
)
language sql stable
as $$
  select distinct
    w.id as word_id,
    w.arabic,
    w.transliteration,
    w.kids_glossary,
    st.label as shared_theme
  from word_themes wt1
  join word_themes wt2 on wt2.sub_theme_id = wt1.sub_theme_id and wt2.word_id != target_word_id
  join words w on w.id = wt2.word_id
  join sub_themes st on st.id = wt1.sub_theme_id
  where wt1.word_id = target_word_id
  limit 50;
$$;

-- Semantic search using embedding similarity
create or replace function search_similar_words(query_embedding vector(384), match_count int default 10)
returns table(
  word_id int,
  arabic text,
  transliteration text,
  kids_glossary text,
  similarity float
)
language sql stable
as $$
  select
    w.id as word_id,
    w.arabic,
    w.transliteration,
    w.kids_glossary,
    1 - (w.embedding <=> query_embedding) as similarity
  from words w
  where w.embedding is not null
  order by w.embedding <=> query_embedding
  limit match_count;
$$;

-- Get graph data for a unit (sub-themes + words + edges)
create or replace function get_unit_graph(unit_code char)
returns json
language sql stable
as $$
  select json_build_object(
    'unit', (select row_to_json(u) from units u where u.code = unit_code),
    'sub_themes', (
      select json_agg(row_to_json(st))
      from sub_themes st
      join units u on u.id = st.unit_id
      where u.code = unit_code
    ),
    'words', (
      select json_agg(json_build_object(
        'id', w.id,
        'arabic', w.arabic,
        'transliteration', w.transliteration,
        'kids_glossary', w.kids_glossary,
        'surah_ayah', w.surah_ayah,
        'difficulty_score', w.difficulty_score,
        'sub_theme_id', wt.sub_theme_id
      ))
      from words w
      join word_themes wt on wt.word_id = w.id
      join sub_themes st on st.id = wt.sub_theme_id
      join units u on u.id = st.unit_id
      where u.code = unit_code
    ),
    'relationships', (
      select json_agg(json_build_object(
        'word_id_1', wr.word_id_1,
        'word_id_2', wr.word_id_2,
        'type', wr.relationship_type,
        'weight', wr.weight
      ))
      from word_relationships wr
      where wr.word_id_1 in (
        select w.id from words w
        join word_themes wt on wt.word_id = w.id
        join sub_themes st on st.id = wt.sub_theme_id
        join units u on u.id = st.unit_id
        where u.code = unit_code
      )
    )
  );
$$;

-- Get word counts per unit (for landing page)
create or replace function get_unit_word_counts()
returns table(code char, count bigint)
language sql stable
as $$
  select u.code, count(distinct wt.word_id)
  from units u
  join sub_themes st on st.unit_id = u.id
  join word_themes wt on wt.sub_theme_id = st.id
  group by u.code
  order by u.code;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table units enable row level security;
alter table sub_themes enable row level security;
alter table words enable row level security;
alter table roots enable row level security;
alter table word_themes enable row level security;
alter table word_relationships enable row level security;

-- Public read access for all educational content
create policy "Public read access" on units for select using (true);
create policy "Public read access" on sub_themes for select using (true);
create policy "Public read access" on words for select using (true);
create policy "Public read access" on roots for select using (true);
create policy "Public read access" on word_themes for select using (true);
create policy "Public read access" on word_relationships for select using (true);

-- ============================================
-- SEED: 15 Units with colors and descriptions
-- ============================================

insert into units (code, name, full_name, description, color, icon, display_order) values
  ('A', 'Animals', 'Animals in the Quran', 'Animals and living creatures mentioned in the Quran', '#E74C3C', '🐪', 1),
  ('B', 'Plants', 'Fruits, Plants, Creation', 'Plants, fruits, and natural creation', '#27AE60', '🌿', 2),
  ('C', 'People', 'People and Family', 'People and family relationships', '#3498DB', '👨‍👩‍👧‍👦', 3),
  ('D', 'Places', 'Places and Nature', 'Geographic locations and natural features', '#8B4513', '🏔️', 4),
  ('E', 'Allah', 'Names of Allah', 'Names and attributes of Allah', '#F1C40F', '✨', 5),
  ('F', 'Salah', 'Salah and Worship', 'Prayer and worship-related terms', '#9B59B6', '🕌', 6),
  ('G', 'Time', 'Time, Numbers, Days', 'Time, calendar, and numbers', '#E67E22', '🕐', 7),
  ('H', 'Character', 'Character and Ethics', 'Character qualities and ethical principles', '#1ABC9C', '⚖️', 8),
  ('I', 'Body', 'Body and Senses', 'Body parts and sensory terms', '#E91E63', '👁️', 9),
  ('J', 'Opposites', 'Opposites and Big Concepts', 'Opposites and major conceptual pairs', '#2196F3', '☯️', 10),
  ('K', 'Prophets', 'Prophets & People', 'Prophets and notable people from the Quran', '#FF9800', '📖', 11),
  ('L', 'Virtues', 'Virtue Pairs', 'Virtue pairs and positive character traits', '#4CAF50', '💎', 12),
  ('M', 'Heart', 'Spiritual Heart Actions', 'Heart-related spiritual actions and emotions', '#C2185B', '❤️', 13),
  ('N', 'Emotions', 'Emotions in the Quran', 'Emotional and psychological states', '#00BCD4', '🌊', 14),
  ('O', 'Colors', 'Colors & Descriptors', 'Colors, descriptive adjectives, and qualities', '#795548', '🎨', 15);

-- Trigger to update words.updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger words_updated_at
  before update on words
  for each row
  execute function update_updated_at();
