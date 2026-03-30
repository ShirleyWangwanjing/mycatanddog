import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const stripWrappingQuotes = (value: string) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const supabaseUrl = stripWrappingQuotes(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '');
let supabaseAnonKey = stripWrappingQuotes(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '');
let serviceRoleKey = stripWrappingQuotes(process.env.SUPABASE_SERVICE_ROLE_KEY || '');

const DEFAULT_PASSWORD = '123456';

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL');
}

const hasNonAscii = (value: string) => /[^\x00-\x7F]/.test(value);
if (hasNonAscii(supabaseAnonKey)) {
  console.warn('VITE_SUPABASE_ANON_KEY contains non-ASCII characters; ignoring.');
  supabaseAnonKey = '';
}
if (hasNonAscii(serviceRoleKey)) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY contains non-ASCII characters; ignoring.');
  serviceRoleKey = '';
}

const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const supabaseServer = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/register', (_req, res) => {
  res.status(405).json({
    ok: false,
    message: '请使用 POST /api/register',
    example: {
      phone: '13812345678',
      nickname: '小明',
      city: '上海'
    }
  });
});

app.post('/api/register', async (req, res) => {
  const phone = String(req.body?.phone || '').trim().replace(/[^\d]/g, '');
  const nickname = String(req.body?.nickname || '').trim();
  const city = String(req.body?.city || '').trim();

  if (!/^1?\d{10,11}$/.test(phone)) {
    return res.status(400).json({ ok: false, message: '请输入正确的手机号' });
  }
  if (!nickname) {
    return res.status(400).json({ ok: false, message: '请输入昵称' });
  }
  if (!city) {
    return res.status(400).json({ ok: false, message: '请输入城市' });
  }

  try {
    const clientForDb = supabaseAdmin ?? supabaseServer;
    if (!clientForDb) {
      return res.status(500).json({ ok: false, code: 'missing_anon_key', message: '服务器缺少 VITE_SUPABASE_ANON_KEY 配置' });
    }

    const { data: existingProfile, error: existingProfileError } = await clientForDb
      .from('profiles')
      .select('id')
      .eq('phone_number', phone)
      .maybeSingle();

    if (existingProfileError) {
      return res.status(500).json({ ok: false, message: existingProfileError.message });
    }

    if (existingProfile) {
      return res.status(409).json({ ok: false, message: '该手机号已注册，请直接登录' });
    }

    let userId: string | null = null;
    if (supabaseAdmin) {
      const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        phone,
        password: DEFAULT_PASSWORD,
        phone_confirm: true,
        user_metadata: { nickname, city, phone_number: phone }
      });

      if (createUserError || !createUserData.user) {
        return res.status(400).json({ ok: false, message: createUserError?.message || '注册失败' });
      }

      userId = createUserData.user.id;
    } else {
      return res.status(501).json({
        ok: false,
        code: 'missing_service_role_key',
        message: '当前 Supabase 已禁用邮箱注册（email_provider_disabled）。无验证码手机号注册需要在服务端配置 SUPABASE_SERVICE_ROLE_KEY。'
      });
    }

    const { error: profileError } = await clientForDb.from('profiles').upsert({
      id: userId,
      phone_number: phone,
      nickname,
      city,
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      return res.status(500).json({ ok: false, message: profileError.message });
    }

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || '服务器错误' });
  }
});

const port = Number(process.env.PORT || 3003);
app.listen(port, () => {
  console.log(`api listening on http://localhost:${port}`);
});

