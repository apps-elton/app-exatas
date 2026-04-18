-- Seed inicial dos 9 planos.
-- Preços em centavos. stripe_price_ids ficam vazios — serão preenchidos na Fase 2.

INSERT INTO public.plans (id, profile_type, tier, name, description, prices, limits, sort_order) VALUES

('school_free', 'school', 'free', 'Escola Free',
 'Comece gratuito: 1 turma, 5 alunos, 1 professor',
 '{"BRL": 0, "USD": 0}'::jsonb,
 '{"turmas": 1, "alunos": 5, "professores": 1, "projetos": 5, "storage_mb": 100, "branding": false, "custom_domain": false, "subdomain": false, "ads": false, "export": false}'::jsonb,
 10),

('school_pro', 'school', 'pro', 'Escola Pro',
 '10 turmas, 100 alunos, 5 professores, branding personalizado',
 '{"BRL": 14900, "USD": 2900}'::jsonb,
 '{"turmas": 10, "alunos": 100, "professores": 5, "projetos": 100, "storage_mb": 1000, "branding": true, "custom_domain": false, "subdomain": true, "ads": false, "export": true}'::jsonb,
 20),

('school_premium', 'school', 'premium', 'Escola Premium',
 'Ilimitado + domínio próprio + suporte prioritário',
 '{"BRL": 44900, "USD": 8900}'::jsonb,
 '{"turmas": null, "alunos": null, "professores": null, "projetos": null, "storage_mb": 10000, "branding": true, "custom_domain": true, "subdomain": true, "ads": false, "export": true}'::jsonb,
 30),

('teacher_free', 'teacher', 'free', 'Professor Free',
 'Comece gratuito: 1 turma, 10 alunos, 3 projetos',
 '{"BRL": 0, "USD": 0}'::jsonb,
 '{"turmas": 1, "alunos": 10, "professores": 1, "projetos": 3, "storage_mb": 100, "branding": false, "custom_domain": false, "subdomain": false, "ads": false, "export": false}'::jsonb,
 40),

('teacher_pro', 'teacher', 'pro', 'Professor Pro',
 '5 turmas, 50 alunos, 20 projetos, branding pessoal',
 '{"BRL": 3900, "USD": 900}'::jsonb,
 '{"turmas": 5, "alunos": 50, "professores": 1, "projetos": 20, "storage_mb": 500, "branding": true, "custom_domain": false, "subdomain": true, "ads": false, "export": true}'::jsonb,
 50),

('teacher_premium', 'teacher', 'premium', 'Professor Premium',
 'Ilimitado + domínio próprio',
 '{"BRL": 8900, "USD": 1900}'::jsonb,
 '{"turmas": null, "alunos": null, "professores": 1, "projetos": null, "storage_mb": 2000, "branding": true, "custom_domain": true, "subdomain": true, "ads": false, "export": true}'::jsonb,
 60),

('student_free', 'student', 'free', 'Aluno Free',
 'Acesso básico com ads, 3 projetos pessoais',
 '{"BRL": 0, "USD": 0}'::jsonb,
 '{"turmas": 0, "alunos": 0, "professores": 0, "projetos": 3, "storage_mb": 50, "branding": false, "custom_domain": false, "subdomain": false, "ads": true, "export": false}'::jsonb,
 70),

('student_pro', 'student', 'pro', 'Aluno Pro',
 'Projetos ilimitados, sem ads, com export',
 '{"BRL": 1900, "USD": 499}'::jsonb,
 '{"turmas": 0, "alunos": 0, "professores": 0, "projetos": null, "storage_mb": 500, "branding": false, "custom_domain": false, "subdomain": false, "ads": false, "export": true}'::jsonb,
 80),

('student_premium', 'student', 'premium', 'Aluno Premium',
 'Pro + anotações avançadas (IA futura)',
 '{"BRL": 3900, "USD": 999}'::jsonb,
 '{"turmas": 0, "alunos": 0, "professores": 0, "projetos": null, "storage_mb": 2000, "branding": false, "custom_domain": false, "subdomain": false, "ads": false, "export": true}'::jsonb,
 90)

ON CONFLICT (id) DO NOTHING;
