-- 1. 宠物表 (Pets)
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('狗狗', '猫咪', '其他')),
  breed TEXT NOT NULL,
  age TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  weight TEXT,
  distance TEXT,
  status TEXT NOT NULL DEFAULT '待领养' CHECK (status IN ('待领养', '已领养', '审核中')),
  image TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 用户配置表 (Profiles)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  phone_number TEXT UNIQUE,
  nickname TEXT,
  age TEXT,
  city TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 领养申请表 (Applications)
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  pet_id UUID REFERENCES pets ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT '审核中' CHECK (status IN ('审核中', '已通过', '未通过')),
  progress INTEGER DEFAULT 25,
  milestone TEXT DEFAULT '申请已提交，等待初审',
  living_type TEXT,
  outdoor_space TEXT,
  time_with_pet TEXT,
  family_members TEXT[],
  experience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 消息表 (Messages)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'adoption', 'reminder')),
  is_read BOOLEAN DEFAULT FALSE,
  pet_id UUID REFERENCES pets ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 收藏表 (Favorites)
CREATE TABLE favorites (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  pet_id UUID REFERENCES pets ON DELETE CASCADE,
  PRIMARY KEY (user_id, pet_id)
);

-- 插入 Mock 数据
INSERT INTO pets (name, type, breed, age, gender, weight, distance, status, image, tags, description, location)
VALUES 
('奥利奥', '狗狗', '边境牧羊犬', '2岁', 'male', '45 磅', '1.2公里', '待领养', 'https://lh3.googleusercontent.com/aida-public/AB6AXuACC4tP2w5AOKRcpN1gATjMT5vrZqQd32LZPhoTTREG0O1oXXjEUbEkxttiFYejmg6P5F1rXz7Q2bMETasbrhq95-ekeWTw9whp4_UFZ1DA1YGbH8mpR1z5hTs9oMmdKFHFWNrmDItAkpPoX82HiqvJEEn-KYoIyXjjiHSSN7F1doSGaadZVqvJ-KhH8q7moYJyrEr4sJ4XKUgx-yLqG0_tm-vGP6euG_lw5YtYNGZatIP3MXszBZLzmmmQdxErUBWQXMfRoxZOK3c', ARRAY['聪明', '活力十足'], '奥利奥是一个非常聪明的边境牧羊犬。他已经学会了基本的指令，并且非常渴望学习新技能。他需要大量的运动和精神刺激。', '上海'),
('糯米', '猫咪', '英国短毛猫', '1岁', 'female', '10 磅', '0.8公里', '待领养', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQmXJPogtgLvmFhvKjrRTGrsBjR9RTWt1bwBHpLexfnSQRWlQptjXWQSeVvo7p86tY01BWGfeMfMPC7SYZlQauGjUlJh_BRhM_ZGlcfwY9H1T1NRFQY9SHIk-XBN_kr1_Yy6Ij85gZIChTkq0d41ljZ91hUP-1bE41GfrGZxX6Bh2WJgBp8rwHIaUcovisxMFTvedRaUO9m-I3AXTl_UgImLuZUvZGZZu4OAj5dr1COd597G4cuiRQnc7GwwFSesdvOfHZouqeMn4', ARRAY['粘人', '安静'], '糯米是一只非常温柔的英短。她喜欢安静地待在窗边晒太阳，或者蜷缩在你的腿上。她非常适合安静的家庭环境。', '北京'),
('雪球', '其他', '垂耳兔', '6个月', 'male', '3 磅', '2.5公里', '待领养', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlADNfyndryMZb60ZGHZX6F2ZDPBj-fPa6DWmNkQutGqQrfvMImIVB7rLK3SSVzYWk26zAZbHofbGpKEe6IXLhoeOblb97Cran8rxTn1ulnq3LcvePQ9qaRquwjLpsTi-XT-R_n98WanRG3FXTmndqzuF68_FbeZrXnz5ybY7tlu-0Kwzi9IapYxAgosFgHXbuDBeQhOYttrpM6Y4NWfSvHhv-h0fgg_BXCctZctUgAzwc3p0Dn9zBNUXCuAidGxwEdOnx2Y2rCVg', ARRAY['温顺', '贪吃'], '雪球是一只活泼的小兔子。他非常喜欢吃胡萝卜和新鲜的干草。他性格温顺，很容易相处。', '广州');
