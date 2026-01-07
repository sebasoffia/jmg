-- =====================================================
-- jemingüey - Migración 002: Documentos y AI Prompts
-- =====================================================

-- Tabla: documents (documentos guardados del usuario)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Sin título',
  content TEXT,
  content_type TEXT DEFAULT 'blog',
  word_count INTEGER DEFAULT 0,
  last_analysis JSONB,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para documents
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX idx_documents_favorite ON documents(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Tabla: ai_prompts (prompts del sistema editables por admin)
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  model TEXT DEFAULT 'moonshotai/kimi-k2-thinking',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  is_active BOOLEAN DEFAULT TRUE,
  is_pro_only BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: ai_usage (tracking de uso de AI por usuario)
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES ai_prompts(id) ON DELETE SET NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);

-- Tabla: admin_users (usuarios con permisos de admin)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- RLS para documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS para ai_prompts (todos pueden leer los activos, solo admins pueden modificar)
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active prompts"
  ON ai_prompts FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage prompts"
  ON ai_prompts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS para ai_usage
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS para admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin list"
  ON admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- =====================================================
-- Datos iniciales: Prompts de AI predefinidos
-- =====================================================

INSERT INTO ai_prompts (name, description, system_prompt, user_prompt_template, is_pro_only, sort_order) VALUES
(
  'simplify',
  'Simplificar texto para mayor claridad',
  'Eres un experto editor de contenido en español. Tu tarea es simplificar el texto manteniendo el significado original.
Reglas:
- Usa oraciones más cortas (máximo 20 palabras)
- Elimina palabras innecesarias
- Reemplaza palabras complejas por alternativas más simples
- Mantén la voz activa cuando sea posible
- No cambies el significado ni el tono general
- Responde SOLO con el texto mejorado, sin explicaciones',
  'Simplifica este texto:\n\n{{text}}',
  FALSE,
  1
),
(
  'professional',
  'Hacer el texto más profesional y formal',
  'Eres un experto en comunicación corporativa en español. Tu tarea es hacer el texto más profesional y formal.
Reglas:
- Usa un tono formal pero accesible
- Elimina coloquialismos
- Mejora la estructura y coherencia
- Mantén la claridad
- Responde SOLO con el texto mejorado, sin explicaciones',
  'Hazlo más profesional:\n\n{{text}}',
  FALSE,
  2
),
(
  'friendly',
  'Hacer el texto más cercano y amigable',
  'Eres un experto en copywriting conversacional en español. Tu tarea es hacer el texto más cercano y amigable.
Reglas:
- Usa un tono cálido y cercano
- Habla directamente al lector (usa "tú")
- Simplifica sin perder información importante
- Añade calidez sin ser excesivo
- Responde SOLO con el texto mejorado, sin explicaciones',
  'Hazlo más amigable:\n\n{{text}}',
  FALSE,
  3
),
(
  'persuasive',
  'Hacer el texto más persuasivo para ventas',
  'Eres un experto copywriter de ventas en español. Tu tarea es hacer el texto más persuasivo.
Reglas:
- Enfatiza los beneficios sobre las características
- Usa verbos de acción
- Crea urgencia sutil cuando sea apropiado
- Incluye llamados a la acción implícitos
- Mantén la credibilidad
- Responde SOLO con el texto mejorado, sin explicaciones',
  'Hazlo más persuasivo:\n\n{{text}}',
  TRUE,
  4
),
(
  'seo_optimize',
  'Optimizar texto para SEO',
  'Eres un experto en SEO y contenido web en español. Tu tarea es optimizar el texto para motores de búsqueda.
Reglas:
- Mejora la estructura con subtítulos si es necesario
- Incluye variaciones naturales de palabras clave
- Optimiza para featured snippets cuando sea posible
- Mantén la legibilidad alta (Flesch > 60)
- Responde SOLO con el texto mejorado, sin explicaciones',
  'Optimiza este texto para SEO:\n\n{{text}}',
  TRUE,
  5
),
(
  'fix_issues',
  'Corregir todos los problemas detectados',
  'Eres un editor experto en español. El texto tiene los siguientes problemas que debes corregir:
{{issues}}

Reglas:
- Corrige TODOS los problemas mencionados
- Mantén el significado y tono original
- Mejora la legibilidad general
- Responde SOLO con el texto corregido, sin explicaciones',
  'Corrige los problemas en este texto:\n\n{{text}}',
  FALSE,
  0
);

-- =====================================================
-- Función para actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
