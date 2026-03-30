export type PetStatus = '待领养' | '已领养' | '审核中';
export type PetType = '狗狗' | '猫咪' | '其他';

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  age: string;
  gender: 'male' | 'female';
  weight?: string;
  distance: string;
  status: PetStatus;
  image: string;
  tags: string[];
  description: string;
  location: string;
}

export interface Application {
  id: string;
  petId: string;
  petName: string;
  petBreed: string;
  petImage: string;
  status: '审核中' | '已通过' | '未通过';
  progress: number;
  milestone: string;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  type: 'system' | 'adoption' | 'reminder';
  petId?: string;
}

export interface DraftApplication {
  step: number;
  livingType: string;
  outdoorSpace: string;
  timeWithPet: string;
  familyMembers: string[];
  experience: string;
}

export const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: '奥利奥',
    type: '狗狗',
    breed: '边境牧羊犬',
    age: '2岁',
    gender: 'male',
    weight: '45 磅',
    distance: '1.2公里',
    status: '待领养',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACC4tP2w5AOKRcpN1gATjMT5vrZqQd32LZPhoTTREG0O1oXXjEUbEkxttiFYejmg6P5F1rXz7Q2bMETasbrhq95-ekeWTw9whp4_UFZ1DA1YGbH8mpR1z5hTs9oMmdKFHFWNrmDItAkpPoX82HiqvJEEn-KYoIyXjjiHSSN7F1doSGaadZVqvJ-KhH8q7moYJyrEr4sJ4XKUgx-yLqG0_tm-vGP6euG_lw5YtYNGZatIP3MXszBZLzmmmQdxErUBWQXMfRoxZOK3c',
    tags: ['聪明', '活力十足'],
    description: '奥利奥是一个非常聪明的边境牧羊犬。他已经学会了基本的指令，并且非常渴望学习新技能。他需要大量的运动和精神刺激。',
    location: '旧金山, 加州'
  },
  {
    id: '2',
    name: '糯米',
    type: '猫咪',
    breed: '英国短毛猫',
    age: '1岁',
    gender: 'female',
    weight: '10 磅',
    distance: '0.8公里',
    status: '待领养',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQmXJPogtgLvmFhvKjrRTGrsBjR9RTWt1bwBHpLexfnSQRWlQptjXWQSeVvo7p86tY01BWGfeMfMPC7SYZlQauGjUlJh_BRhM_ZGlcfwY9H1T1NRFQY9SHIk-XBN_kr1_Yy6Ij85gZIChTkq0d41ljZ91hUP-1bE41GfrGZxX6Bh2WJgBp8rwHIaUcovisxMFTvedRaUO9m-I3AXTl_UgImLuZUvZGZZu4OAj5dr1COd597G4cuiRQnc7GwwFSesdvOfHZouqeMn4',
    tags: ['粘人', '安静'],
    description: '糯米是一只非常温柔的英短。她喜欢安静地待在窗边晒太阳，或者蜷缩在你的腿上。她非常适合安静的家庭环境。',
    location: '旧金山, 加州'
  },
  {
    id: '3',
    name: '雪球',
    type: '其他',
    breed: '垂耳兔',
    age: '6个月',
    gender: 'male',
    weight: '3 磅',
    distance: '2.5公里',
    status: '待领养',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlADNfyndryMZb60ZGHZX6F2ZDPBj-fPa6DWmNkQutGqQrfvMImIVB7rLK3SSVzYWk26zAZbHofbGpKEe6IXLhoeOblb97Cran8rxTn1ulnq3LcvePQ9qaRquwjLpsTi-XT-R_n98WanRG3FXTmndqzuF68_FbeZrXnz5ybY7tlu-0Kwzi9IapYxAgosFgHXbuDBeQhOYttrpM6Y4NWfSvHhv-h0fgg_BXCctZctUgAzwc3p0Dn9zBNUXCuAidGxwEdOnx2Y2rCVg',
    tags: ['温顺', '贪吃'],
    description: '雪球是一只活泼的小兔子。他非常喜欢吃胡萝卜和新鲜的干草。他性格温顺，很容易相处。',
    location: '旧金山, 加州'
  },
  {
    id: '4',
    name: '土豆',
    type: '狗狗',
    breed: '金毛寻回犬',
    age: '3岁',
    gender: 'female',
    weight: '65 磅',
    distance: '5.0公里',
    status: '待领养',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFxnXmgXvgsecL-bpzQ2hNSoy5iqXambFNkOYZLrsqvgwzCRrza5iEU8fnROi1iyvPijCuyaY0-ICTmnDZCkB8CPibXYnVRqQy-qlwJuDTLQDau08F413hhQ_rGCtSZUB54-2CvDICPYkOo4Q7TnqsUziFY06nosT1q7WY91aBFQpvOX1WSZmPpy1Bj6Zt8wBH2zyw-O1wM5dpLwJ09QDMuJlSI1zvkrheadCyEgqpo8C6WtGovHrkwmmqWLz_pSoKlnqdT-gMiCY',
    tags: ['陪伴', '亲人'],
    description: '土豆是一只典型的金毛，非常亲人且温顺。她喜欢玩球，也喜欢在水里游泳。她是完美的家庭伴侣。',
    location: '旧金山, 加州'
  },
  {
    id: '5',
    name: 'Buddy',
    type: '狗狗',
    breed: '金毛寻回犬',
    age: '2岁',
    gender: 'male',
    weight: '65 磅',
    distance: '2英里',
    status: '待领养',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKomRrRWHzkxgVqLa-hpTrEihQzXhcPsyHTQ24gwa38RapOcbrlEKoMB94N97iOC9LWmoRPJS5Y_PxTLbW02oY7l65cSmwB4kzWHH5L6suF8h3mRM4P6-llZC_UZdPNNS1kkinXMfTNue6HeHZmLdkxDfTXfoUEq6hV3HZ-q3k_VF2uelKjlOolqbQXDuA2GdImxbUBWvd3NIZb9zMqRKcuXGeS8NiFcB9tnXDMmakhRYeyF2PCHI0Iq9JqNH6ewJDNxOuoFmgm3k',
    tags: ['对儿童友好', '对狗狗友好', '精力充沛'],
    description: '来见见 Buddy，一个拥有金毛寻回犬外表的温暖灵魂。他不仅仅是迎接你；他会摇着柔软的尾巴，带着他最喜欢的网球来庆祝你的到来。Buddy 喜欢在绿意盎然的公园里散步，并且拥有一项专业级的技能：在任何房间里都能找到阳光最充足的地方。',
    location: '旧金山, 加州'
  }
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'a1',
    petId: '1',
    petName: '奥利奥',
    petBreed: '边境牧羊犬',
    petImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACC4tP2w5AOKRcpN1gATjMT5vrZqQd32LZPhoTTREG0O1oXXjEUbEkxttiFYejmg6P5F1rXz7Q2bMETasbrhq95-ekeWTw9whp4_UFZ1DA1YGbH8mpR1z5hTs9oMmdKFHFWNrmDItAkpPoX82HiqvJEEn-KYoIyXjjiHSSN7F1doSGaadZVqvJ-KhH8q7moYJyrEr4sJ4XKUgx-yLqG0_tm-vGP6euG_lw5YtYNGZatIP3MXszBZLzmmmQdxErUBWQXMfRoxZOK3c',
    status: '审核中',
    progress: 75,
    milestone: '最终审核进行中'
  },
  {
    id: 'a2',
    petId: '2',
    petName: '糯米',
    petBreed: '英国短毛猫',
    petImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQmXJPogtgLvmFhvKjrRTGrsBjR9RTWt1bwBHpLexfnSQRWlQptjXWQSeVvo7p86tY01BWGfeMfMPC7SYZlQauGjUlJh_BRhM_ZGlcfwY9H1T1NRFQY9SHIk-XBN_kr1_Yy6Ij85gZIChTkq0d41ljZ91hUP-1bE41GfrGZxX6Bh2WJgBp8rwHIaUcovisxMFTvedRaUO9m-I3AXTl_UgImLuZUvZGZZu4OAj5dr1COd597G4cuiRQnc7GwwFSesdvOfHZouqeMn4',
    status: '已通过',
    progress: 100,
    milestone: '领养成功'
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    title: '欢迎来到 FurForever',
    content: '感谢您加入我们的大家庭！在这里您可以找到最适合您的宠物伙伴。',
    time: '2024-03-20 10:00',
    isRead: true,
    type: 'system'
  },
  {
    id: 'm2',
    title: '领养申请更新',
    content: '您对“糯米”的领养申请已通过初审，请留意后续通知。',
    time: '2024-03-22 14:30',
    isRead: false,
    type: 'adoption',
    petId: '2'
  },
  {
    id: 'm3',
    title: '领养申请更新',
    content: '您对“奥利奥”的领养申请正在审核中。',
    time: '2024-03-23 09:15',
    isRead: false,
    type: 'adoption',
    petId: '1'
  }
];
