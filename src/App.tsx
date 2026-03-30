/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Heart, 
  MapPin, 
  ArrowLeft, 
  Share2, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ChevronRight, 
  LogOut, 
  HelpCircle, 
  Bell, 
  Home, 
  Compass, 
  MessageCircle, 
  User, 
  Plus, 
  X, 
  Info, 
  Stethoscope, 
  ShoppingBag,
  ArrowRight,
  Save,
  Menu,
  Check,
  SlidersHorizontal,
  Smartphone
} from 'lucide-react';
import { Pet, MOCK_PETS, MOCK_APPLICATIONS, PetType, Application, Message, MOCK_MESSAGES, DraftApplication } from './types';
import { supabase } from './lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

type View = 'landing' | 'login' | 'home' | 'profile' | 'detail' | 'form' | 'favorites' | 'messages' | 'edit-profile' | 'applications' | 'guide';

const INITIAL_DRAFT: DraftApplication = {
  step: 1,
  livingType: '独立房屋',
  outdoorSpace: '全封闭院子',
  timeWithPet: '1-2 小时',
  familyMembers: [],
  experience: ''
};

export default function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentView, setCurrentView] = useState<View>('landing');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PetType | '全部'>('全部');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [userProfile, setUserProfile] = useState({
    nickname: '未登录用户',
    age: '-',
    city: '-'
  });
  const [draftApplication, setDraftApplication] = useState<DraftApplication>(() => {
    try {
      const saved = localStorage.getItem('pet_adoption_draft');
      return saved ? JSON.parse(saved) : INITIAL_DRAFT;
    } catch (e) {
      console.error('Error parsing draft from localStorage:', e);
      return INITIAL_DRAFT;
    }
  });

  // 监听身份验证状态变化
  useEffect(() => {
    // 检查初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    // 监听状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser.id);
      } else {
        // 清除用户数据
        setFavorites([]);
        setApplications([]);
        setMessages([]);
        setUserProfile({
          nickname: '未登录用户',
          age: '-',
          city: '-'
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 初始化宠物数据
  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    const { data, error } = await supabase
      .from('pets')
      .select('*');
    if (data) setPets(data);
    else if (error) console.error('Error fetching pets:', error);
  };

  const fetchUserData = async (userId: string) => {
    if (!userId) return;

    // 获取申请
    const { data: appData } = await supabase
      .from('applications')
      .select('*, pets(name, breed, image)')
      .eq('user_id', userId);
    
    if (appData) {
      const formattedApps = appData.map(app => ({
        id: app.id,
        petId: app.pet_id,
        petName: app.pets?.name || '未知宠物',
        petBreed: app.pets?.breed || '未知品种',
        petImage: app.pets?.image || '',
        status: app.status,
        progress: app.progress,
        milestone: app.milestone
      }));
      setApplications(formattedApps);
    }

    // 获取消息
    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (msgData) {
      setMessages(msgData.map(msg => ({
        id: msg.id,
        title: msg.title,
        content: msg.content,
        time: new Date(msg.created_at).toLocaleString('zh-CN', { hour12: false }),
        isRead: msg.is_read,
        type: msg.type,
        petId: msg.pet_id
      })));
    }

    // 获取收藏
    const { data: favData } = await supabase
      .from('favorites')
      .select('pet_id')
      .eq('user_id', userId);
    
    if (favData) {
      setFavorites(favData.map(f => f.pet_id));
    }

    // 获取个人资料
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileData) {
      setUserProfile({
        nickname: profileData.nickname || '新用户',
        age: profileData.age || '20',
        city: profileData.city || '上海'
      });
    } else {
      // 如果没有 Profile，创建一个默认的
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ id: userId, nickname: '新用户', age: '20', city: '上海' })
        .select()
        .single();
      if (newProfile) {
        setUserProfile({
          nickname: newProfile.nickname,
          age: newProfile.age,
          city: newProfile.city
        });
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('pet_adoption_draft', JSON.stringify(draftApplication));
  }, [draftApplication]);

  const filteredPets = useMemo(() => {
    const listToFilter = pets.length > 0 ? pets : MOCK_PETS;
    return listToFilter.filter(pet => {
      const matchesSearch = pet.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           pet.breed.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === '全部' || pet.type === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, pets]);

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setCurrentView('login');
      return;
    }
    const isFav = favorites.includes(id);
    
    if (isFav) {
      await supabase.from('favorites').delete().match({ user_id: user.id, pet_id: id });
      setFavorites(prev => prev.filter(f => f !== id));
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, pet_id: id });
      setFavorites(prev => [...prev, id]);
    }
  };

  const navigateToDetail = (pet: Pet) => {
    setSelectedPet(pet);
    setCurrentView('detail');
  };

  const handleFormComplete = async () => {
    if (!user) {
      setCurrentView('login');
      return;
    }
    if (selectedPet) {
      // 提交申请到 Supabase
      const { data: newApp, error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          pet_id: selectedPet.id,
          status: '审核中',
          progress: 25,
          milestone: '申请已提交，等待初审',
          living_type: draftApplication.livingType,
          outdoor_space: draftApplication.outdoorSpace,
          time_with_pet: draftApplication.timeWithPet,
          family_members: draftApplication.familyMembers,
          experience: draftApplication.experience
        })
        .select()
        .single();

      if (newApp) {
        const formattedApp: Application = {
          id: newApp.id,
          petId: selectedPet.id,
          petName: selectedPet.name,
          petBreed: selectedPet.breed,
          petImage: selectedPet.image,
          status: '审核中',
          progress: 25,
          milestone: '申请已提交，等待初审'
        };
        setApplications(prev => [formattedApp, ...prev]);

        // 发送消息
        const { data: newMessage } = await supabase
          .from('messages')
          .insert({
            user_id: user.id,
            title: '领养申请提交成功',
            content: `恭喜！您对“${selectedPet.name}”的领养申请已提交成功，我们将尽快为您审核。`,
            type: 'adoption',
            pet_id: selectedPet.id
          })
          .select()
          .single();

        if (newMessage) {
          setMessages(prev => [{
            id: newMessage.id,
            title: newMessage.title,
            content: newMessage.content,
            time: new Date(newMessage.created_at).toLocaleString('zh-CN', { hour12: false }),
            isRead: false,
            type: 'adoption',
            petId: selectedPet.id
          }, ...prev]);
        }

        setDraftApplication(INITIAL_DRAFT);
      } else if (error) {
        console.error('Error submitting application:', error);
      }
    }
    setCurrentView('profile');
  };

  const handleSaveProfile = async (profile: { nickname: string, age: string, city: string }) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profile,
        updated_at: new Date().toISOString()
      });
    
    if (!error) {
      setUserProfile(profile);
      setCurrentView('profile');
    } else {
      console.error('Error saving profile:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex justify-center items-center p-0 md:p-4 selection:bg-primary-container selection:text-on-primary-container">
      {/* Mobile Frame Container */}
      <div className="w-full h-full md:h-[844px] md:max-w-[390px] md:rounded-[3rem] md:shadow-2xl bg-surface relative overflow-hidden flex flex-col border-0 md:border-[8px] border-zinc-800">
        
        {/* Mini-program Capsule Button (Top Right) */}
        <div className="fixed md:absolute top-4 right-4 z-[100] flex items-center gap-2 bg-white/80 backdrop-blur-lg border border-zinc-200 rounded-full px-3 py-1.5 shadow-sm pointer-events-auto">
          <div className="flex items-center gap-3">
            <button className="text-zinc-800 hover:opacity-70 transition-opacity">
              <div className="flex flex-col gap-0.5">
                <div className="w-1 h-1 bg-current rounded-full"></div>
                <div className="w-1 h-1 bg-current rounded-full"></div>
                <div className="w-1 h-1 bg-current rounded-full"></div>
              </div>
            </button>
            <div className="w-[1px] h-4 bg-zinc-200"></div>
            <button className="text-zinc-800 hover:opacity-70 transition-opacity">
              <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait">
            {currentView === 'landing' && (
              <motion.div 
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <LandingView onStart={() => setCurrentView('home')} onLogin={() => setCurrentView('login')} />
              </motion.div>
            )}

            {currentView === 'login' && (
              <motion.div 
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full h-full"
              >
                <LoginView onBack={() => setCurrentView('landing')} onLoginSuccess={() => setCurrentView('home')} />
              </motion.div>
            )}

            {currentView === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <HomeView 
                  pets={filteredPets}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onPetClick={navigateToDetail}
                  onProfileClick={() => setCurrentView('profile')}
                />
              </motion.div>
            )}

            {currentView === 'favorites' && (
              <motion.div 
                key="favorites"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full"
              >
                <FavoritesView 
                  pets={pets.length > 0 ? pets : MOCK_PETS}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onPetClick={navigateToDetail}
                  onBack={() => setCurrentView('home')}
                />
              </motion.div>
            )}

            {currentView === 'messages' && (
              <motion.div 
                key="messages"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <MessagesView 
                  messages={messages}
                  onBack={() => setCurrentView('home')}
                  onViewDetails={(petId) => {
                    if (petId) {
                      const pet = (pets.length > 0 ? pets : MOCK_PETS).find(p => p.id === petId);
                      if (pet) {
                        setSelectedPet(pet);
                        setCurrentView('detail');
                        return;
                      }
                    }
                    setCurrentView('profile');
                  }}
                />
              </motion.div>
            )}

            {currentView === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <ProfileView 
                  applications={applications}
                  favoritesCount={favorites.length}
                  messagesCount={messages.length}
                  userProfile={userProfile}
                  isLoggedIn={!!user}
                  onBack={() => setCurrentView('home')}
                  onHomeClick={() => setCurrentView('home')}
                  onEditProfile={() => setCurrentView('edit-profile')}
                  onViewAllApplications={() => setCurrentView('applications')}
                  onPetClick={navigateToDetail}
                  onViewGuide={() => setCurrentView('guide')}
                  onLogin={() => setCurrentView('login')}
                  onLogout={handleLogout}
                />
              </motion.div>
            )}

            {currentView === 'guide' && (
              <motion.div 
                key="guide"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <AdoptionGuideView onBack={() => setCurrentView('profile')} />
              </motion.div>
            )}

            {currentView === 'applications' && (
              <motion.div 
                key="applications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <ApplicationsView 
                  applications={applications}
                  onBack={() => setCurrentView('profile')}
                  onPetClick={navigateToDetail}
                />
              </motion.div>
            )}

            {currentView === 'edit-profile' && (
              <motion.div 
                key="edit-profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <EditProfileView 
                  userProfile={userProfile}
                  onBack={() => setCurrentView('profile')}
                  onSave={handleSaveProfile}
                />
              </motion.div>
            )}

            {currentView === 'detail' && selectedPet && (
              <motion.div 
                key="detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <PetDetailView 
                  pet={selectedPet}
                  onBack={() => setCurrentView('home')}
                  onApply={() => setCurrentView(user ? 'form' : 'login')}
                  applicationStatus={applications.find(app => app.petId === selectedPet.id)?.status}
                />
              </motion.div>
            )}

            {currentView === 'form' && (
              <motion.div 
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full"
              >
                {user ? (
                  <ApplicationFormView 
                    pet={selectedPet}
                    draft={draftApplication}
                    onUpdateDraft={(updatedDraft) => setDraftApplication(updatedDraft)}
                    onBack={() => setCurrentView('detail')}
                    onComplete={handleFormComplete}
                  />
                ) : (
                  <LoginView onBack={() => setCurrentView('detail')} onLoginSuccess={() => setCurrentView('form')} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation for Home, Profile, Favorites, and Messages */}
        {(currentView === 'home' || currentView === 'profile' || currentView === 'favorites' || currentView === 'messages') && (
          <nav className="absolute bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-3 bg-white/95 backdrop-blur-xl border-t border-zinc-100 z-50">
            <button 
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center justify-center px-5 py-2 transition-all duration-200 ${currentView === 'home' ? 'text-primary' : 'text-zinc-400 hover:text-primary'}`}
            >
              <Home size={22} fill={currentView === 'home' ? "currentColor" : "none"} strokeWidth={currentView === 'home' ? 2.5 : 2} />
              <span className={`text-[10px] font-bold mt-1 ${currentView === 'home' ? 'opacity-100' : 'opacity-60'}`}>首页</span>
            </button>
            <button 
              onClick={() => setCurrentView('favorites')}
              className={`flex flex-col items-center justify-center px-5 py-2 transition-all duration-200 ${currentView === 'favorites' ? 'text-primary' : 'text-zinc-400 hover:text-primary'}`}
            >
              <Heart size={22} fill={currentView === 'favorites' ? "currentColor" : "none"} strokeWidth={currentView === 'favorites' ? 2.5 : 2} />
              <span className={`text-[10px] font-bold mt-1 ${currentView === 'favorites' ? 'opacity-100' : 'opacity-60'}`}>收藏</span>
            </button>
            <button 
              onClick={() => setCurrentView('messages')}
              className={`flex flex-col items-center justify-center px-5 py-2 transition-all duration-200 ${currentView === 'messages' ? 'text-primary' : 'text-zinc-400 hover:text-primary'}`}
            >
              <div className="relative">
                <MessageCircle size={22} fill={currentView === 'messages' ? "currentColor" : "none"} strokeWidth={currentView === 'messages' ? 2.5 : 2} />
                {messages.some(m => !m.isRead) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-white"></span>
                )}
              </div>
              <span className={`text-[10px] font-bold mt-1 ${currentView === 'messages' ? 'opacity-100' : 'opacity-60'}`}>消息</span>
            </button>
            <button 
              onClick={() => setCurrentView('profile')}
              className={`flex flex-col items-center justify-center px-5 py-2 transition-all duration-200 ${currentView === 'profile' ? 'text-primary' : 'text-zinc-400 hover:text-primary'}`}
            >
              <User size={22} fill={currentView === 'profile' ? "currentColor" : "none"} strokeWidth={currentView === 'profile' ? 2.5 : 2} />
              <span className={`text-[10px] font-bold mt-1 ${currentView === 'profile' ? 'opacity-100' : 'opacity-60'}`}>我的</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

// --- Sub-Views ---

function LandingView({ onStart, onLogin }: { onStart: () => void, onLogin: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-between p-6 relative overflow-hidden"
    >
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 -right-48 w-[32rem] h-[32rem] bg-tertiary-fixed/5 rounded-full blur-[100px]"></div>

      <main className="relative z-10 w-full max-w-lg flex flex-col items-center text-center mt-12 mb-8">
        <div className="relative w-full aspect-[4/5] mb-12">
          <div className="absolute inset-0 bg-surface-container-high rounded-[3rem] rotate-2 scale-105 opacity-50"></div>
          <div className="absolute inset-0 bg-secondary-fixed/30 rounded-[3rem] -rotate-1 scale-102"></div>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm0arEMttq78Z2Gaxhb_QVqACvJTUR2V5ufRNOI7Ctk_2JvkzdxpsIdHSPb99rtdsRdVo15TWifQGHkVZdV0X0bXh8MOlsHot_wuIhLLvvbuoWzxgo3Hjyu7IbGPgUGWjjsxqU7F3qGh96mTXCXY62xk_qnd5XPE3L1cO9zv14Torr-w82NfJaz_ouQeEhZ0Hv93iDPO4G_pOIrttCR1JsFr-swXz34nvNqHAI-tR7KoAc9D2tv7NdIRoX5ULgiGxTndngxOAm_DU" 
            alt="Scottish Fold Cat"
            className="relative z-10 w-full h-full object-cover rounded-[2.5rem] shadow-xl"
          />
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="absolute -bottom-6 -right-4 z-20 editorial-gradient text-white rounded-full p-4 shadow-lg cursor-pointer"
          >
            <Heart size={32} fill="currentColor" />
          </motion.div>
        </div>

        <section className="space-y-6 px-4">
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tight leading-tight">
            遇见你的<span className="text-primary italic">终身伴侣</span>
          </h1>
          <p className="font-body text-secondary text-lg leading-relaxed max-w-md mx-auto">
            每一个生命都值得被温柔以待。在 <span className="font-bold text-primary-dim">FurForever</span>，我们致力于连接 those渴望爱的心，为每一只流浪的小动物寻找一个永远的家。
          </p>
        </section>
      </main>

      <footer className="relative z-10 w-full max-w-md flex flex-col items-center space-y-6 pb-8">
        <button 
          onClick={onStart}
          className="group w-full editorial-gradient py-5 rounded-full flex items-center justify-center space-x-3 shadow-lg hover:shadow-primary-fixed/30 active:scale-[0.96] transition-all duration-200"
        >
          <span className="font-headline font-bold text-xl text-white">开启寻宠之旅</span>
          <ArrowRight className="text-white group-hover:translate-x-1 transition-transform" />
        </button>
        <div className="flex items-center space-x-1">
          <span className="font-label text-sm text-outline">已有账号？</span>
          <button 
            onClick={onLogin}
            className="font-label text-sm font-bold text-primary-dim hover:text-primary transition-colors py-2 px-1"
          >
            立即登录
          </button>
        </div>
      </footer>
    </motion.div>
  );
}

function LoginView({ onBack, onLoginSuccess }: { onBack: () => void, onLoginSuccess: () => void }) {
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('123456'); // 默认密码简化演示
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedPhone = phone.trim().replace(/[^\d]/g, '');
    if (!/^1?\d{10,11}$/.test(normalizedPhone)) {
      setLoading(false);
      setError('请输入正确的手机号');
      return;
    }

    try {
      if (isRegister) {
        if (!nickname.trim()) {
          throw new Error('请输入昵称');
        }
        if (!city.trim()) {
          throw new Error('请输入城市');
        }

        const resp = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: normalizedPhone,
            nickname: nickname.trim(),
            city: city.trim(),
          }),
        });

        const result = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(result?.message || '注册失败，请稍后再试');
        }

        alert('注册成功！');
        setIsRegister(false);
        setPhone(normalizedPhone);
        setError(null);
      } else {
        const { error: phoneSignInError } = await supabase.auth.signInWithPassword({
          phone: normalizedPhone,
          password
        });

        if (phoneSignInError) {
          const fallbackEmail = `${normalizedPhone}@furforever.com`;
          const { error: emailSignInError } = await supabase.auth.signInWithPassword({
            email: fallbackEmail,
            password
          });

          if (emailSignInError) {
            const msg = (emailSignInError.message || phoneSignInError.message || '');
            if (msg.includes('Invalid login credentials')) {
              throw new Error('手机号或密码错误');
            }
            throw new Error('登录失败，请稍后再试');
          }
        }
        
        onLoginSuccess();
      }
    } catch (err: any) {
      // 捕获并显示友好的错误信息，不再显示内部生成的模拟邮箱
      setError(err.message || '操作失败，请检查网络或重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F9F9F7] flex flex-col relative overflow-hidden"
    >
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors active:scale-90">
          <ArrowLeft size={20} className="text-[#8e4900]" />
        </button>
        <h1 className="font-headline text-lg font-extrabold text-[#8e4900] tracking-tight text-center flex-1 pr-8">
          {isRegister ? '加入我们' : 'FurForever'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12">
        <main className="max-w-md mx-auto pt-4 flex flex-col items-center">
          
          {/* Top Illustration Card */}
          <div className="relative w-full aspect-[4/3] mb-8">
            <div className="absolute inset-0 bg-white rounded-[3rem] shadow-xl overflow-hidden border-8 border-white">
              <img 
                src={isRegister 
                  ? "https://images.unsplash.com/photo-1591160690555-5debfba289f0?q=80&w=800&auto=format&fit=crop" 
                  : "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop"
                } 
                alt="Pet Illustration" 
                className="w-full h-full object-cover rounded-[2rem]"
              />
            </div>
            {/* Paw Icon Overlay (matching prototype) */}
            {isRegister && (
              <div className="absolute -bottom-4 -right-2 w-16 h-16 bg-[#f99138] rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-200 z-10">
                <div className="grid grid-cols-2 gap-1 p-3">
                  <div className="w-2.5 h-2.5 bg-current rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-current rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-current rounded-full col-span-2 mx-auto"></div>
                </div>
              </div>
            )}
          </div>

          {/* Welcome Text */}
          <div className="w-full text-left space-y-2 mb-8 px-2">
            <h2 className="font-headline text-3xl font-black text-on-surface tracking-tight">
              {isRegister ? '加入我们' : '欢迎回来'}
            </h2>
            <p className="text-on-surface-variant font-medium text-sm">
              {isRegister ? '为流浪动物寻找一个永远的家' : '登录以继续您的领养之旅'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                  <Smartphone size={22} />
                </div>
                <input 
                  type="tel" 
                  placeholder={isRegister ? "手机号" : "请输入手机号"}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-sm pl-16 pr-6 py-5 rounded-[1.5rem] border border-zinc-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-medium text-on-surface shadow-sm"
                />
              </div>

              {isRegister && (
                <>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                      <User size={22} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="昵称"
                      required
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-white/60 backdrop-blur-sm pl-16 pr-6 py-5 rounded-[1.5rem] border border-zinc-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-medium text-on-surface shadow-sm"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                      <MapPin size={22} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="城市"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white/60 backdrop-blur-sm pl-16 pr-6 py-5 rounded-[1.5rem] border border-zinc-100 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all font-medium text-on-surface shadow-sm"
                    />
                  </div>
                </>
              )}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-error font-bold px-4 pt-2"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full editorial-gradient py-5 rounded-[1.5rem] text-white font-headline font-bold text-lg shadow-xl shadow-orange-100 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? '正在处理...' : (isRegister ? '立即注册' : '登录')}
              {isRegister && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Social Logins & Footer */}
          {!isRegister && (
            <div className="w-full mt-12 space-y-8">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200"></div>
                </div>
                <span className="relative px-4 bg-[#F9F9F7] text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">
                  其他登录方式
                </span>
              </div>

              <div className="flex justify-center gap-6">
                <button className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-zinc-200 transition-all active:scale-90">
                  <MessageCircle size={22} fill="currentColor" className="opacity-60" />
                </button>
                <button className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-zinc-200 transition-all active:scale-90">
                  <div className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="mt-12 mb-8">
            <p className="text-sm font-medium text-on-surface-variant">
              {isRegister ? '已有账号？' : '还没有账号？'}
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="font-black text-[#8e4900] hover:text-primary transition-colors ml-1 border-b-2 border-[#8e4900]/20 pb-0.5"
              >
                {isRegister ? '立即登录' : '立即注册'}
              </button>
            </p>
          </div>

          {isRegister && (
            <div className="mt-auto pt-8 flex flex-col items-center space-y-4">
              <div className="flex w-32 h-1 bg-zinc-200 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-[#8e4900]"></div>
              </div>
              <span className="text-[10px] font-black tracking-[0.3em] text-[#8e4900]/30 uppercase">Kindred Paws Sanctuary</span>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
}

function EditProfileView({ 
  userProfile, 
  onBack, 
  onSave 
}: { 
  userProfile: { nickname: string, age: string, city: string }, 
  onBack: () => void, 
  onSave: (profile: { nickname: string, age: string, city: string }) => void 
}) {
  const [nickname, setNickname] = useState(userProfile.nickname);
  const [age, setAge] = useState(userProfile.age);
  const [city, setCity] = useState(userProfile.city);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-[#F9F9F7] pb-32"
    >
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:bg-zinc-100 transition-colors p-2 rounded-full active:scale-95">
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">编辑个人信息</h1>
        </div>
        <button 
          onClick={() => onSave({ nickname, age, city })}
          className="text-primary font-bold text-sm px-4 py-2 hover:bg-primary/5 rounded-full transition-colors"
        >
          保存
        </button>
      </header>

      <main className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 relative group cursor-pointer">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLZcA_qQltneMIcme8av9TTGIS1pyIjae3f97BD7GTVMAOQ0sjQRvil6l0prlo6FRRJ9x7BytddBjpwrzRMDDjBomDmtd_gx04lxUM3RdOCpcj0ImNCJKw9WxlXG11tvmZIpeuyEaXXRiKVhS0jFSIlc9ftFGOBB7LqSzZ-emFx55fAtUnW5d8HHky9T5czxX-WekeZI7xHPQewHQEpcEJNMygH1soj6sD_VFhjL2cKBJNjI6KVJ7yNmfjrd56YsvLOpQZuSSQyto" 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">点击更换头像</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">昵称</label>
              <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 focus-within:border-primary transition-colors">
                <User size={18} className="text-on-surface-variant" />
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-on-surface"
                  placeholder="请输入昵称"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">年龄</label>
              <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 focus-within:border-primary transition-colors">
                <Calendar size={18} className="text-on-surface-variant" />
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-on-surface"
                  placeholder="请输入年龄"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">所在城市</label>
              <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 focus-within:border-primary transition-colors">
                <MapPin size={18} className="text-on-surface-variant" />
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-on-surface"
                  placeholder="请输入所在城市"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={() => onSave({ nickname, age, city })}
            className="w-full bg-zinc-900 text-white font-headline font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            保存修改
          </button>
        </div>
      </main>
    </motion.div>
  );
}

function MessagesView({ messages, onBack, onViewDetails }: { messages: Message[], onBack: () => void, onViewDetails: (petId?: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-32"
    >
      <header className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:bg-zinc-100 transition-colors p-2 rounded-full active:scale-95">
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">消息中心</h1>
        </div>
        <div className="w-8 h-8"></div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <MessageCircle size={48} className="mb-4" />
            <p className="font-medium">暂无消息</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border transition-all ${msg.isRead ? 'bg-white border-zinc-100' : 'bg-primary/5 border-primary/10 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${msg.isRead ? 'bg-transparent' : 'bg-primary'}`}></div>
                  <h3 className="font-headline font-bold text-on-surface">{msg.title}</h3>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{msg.time}</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{msg.content}</p>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => onViewDetails(msg.petId)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  查看详情
                </button>
              </div>
            </motion.div>
          ))
        )}
      </main>
    </motion.div>
  );
}

function FavoritesView({ 
  pets,
  favorites, 
  toggleFavorite, 
  onPetClick,
  onBack
}: { 
  pets: Pet[],
  favorites: string[], 
  toggleFavorite: (id: string, e: React.MouseEvent) => void,
  onPetClick: (pet: Pet) => void,
  onBack: () => void
}) {
  const favoritePets = useMemo(() => {
    return pets.filter(pet => favorites.includes(pet.id));
  }, [pets, favorites]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-32"
    >
      <header className="sticky top-0 w-full flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-xl z-40 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:bg-zinc-100 transition-colors p-2 rounded-full active:scale-95">
            <ArrowLeft size={20} className="text-zinc-900" />
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-zinc-900">我的收藏</h1>
        </div>
        <div className="w-8 h-8"></div>
      </header>

      <main className="px-6 py-6 max-w-5xl mx-auto">
        {favoritePets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300 mb-4">
              <Heart size={40} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1">暂无收藏</h3>
            <p className="text-sm text-zinc-500">快去首页看看有没有心仪的小伙伴吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {favoritePets.map((pet) => (
              <motion.div 
                key={pet.id}
                layoutId={`fav-pet-${pet.id}`}
                onClick={() => onPetClick(pet)}
                className="bg-white rounded-[2.5rem] overflow-hidden group border border-zinc-100 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 cursor-pointer"
              >
                <div className="relative h-[320px] overflow-hidden">
                  <img 
                    src={pet.image} 
                    alt={pet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md text-zinc-900 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {pet.distance}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => toggleFavorite(pet.id, e)}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-sm bg-primary text-white"
                  >
                    <Heart size={20} fill="currentColor" />
                  </button>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/20">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-2xl font-bold font-headline text-zinc-900">{pet.name}</h3>
                            {pet.gender === 'male' ? (
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-[10px] font-bold">♂</div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 text-[10px] font-bold">♀</div>
                            )}
                          </div>
                          <p className="text-zinc-500 text-xs font-medium flex items-center gap-2">
                            <span>{pet.breed}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                            <span>{pet.age}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">契合度</span>
                          <span className="text-xl font-bold font-mono text-zinc-900">98%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}

function HomeView({ 
  pets, 
  activeCategory, 
  setActiveCategory, 
  searchQuery, 
  setSearchQuery, 
  favorites, 
  toggleFavorite,
  onPetClick,
  onProfileClick
}: { 
  pets: Pet[], 
  activeCategory: string, 
  setActiveCategory: (c: any) => void,
  searchQuery: string,
  setSearchQuery: (s: string) => void,
  favorites: string[],
  toggleFavorite: (id: string, e: React.MouseEvent) => void,
  onPetClick: (pet: Pet) => void,
  onProfileClick: () => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-32"
    >
      <header className="sticky top-0 w-full flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-xl z-40 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest opacity-70">
              <MapPin size={10} />
              <span>上海市 · 静安区</span>
            </div>
            <h1 className="font-headline font-bold text-xl tracking-tight text-zinc-900">寻找新家人</h1>
          </div>
        </div>
        <div className="w-8 h-8"></div> {/* Spacer for capsule */}
      </header>

      <main className="px-6 py-6 max-w-5xl mx-auto">
        <div className="mb-8 flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索品种、性格关键词..."
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-zinc-400 text-sm text-zinc-900"
            />
          </div>
          <button className="w-12 h-12 flex items-center justify-center bg-zinc-100 rounded-2xl text-zinc-600 hover:bg-zinc-200 transition-colors">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-8 no-scrollbar">
          {['全部', '狗狗', '猫咪', '其他'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                activeCategory === cat 
                  ? 'bg-zinc-900 text-white shadow-md shadow-zinc-200' 
                  : 'bg-white border border-zinc-100 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-10">
          {pets.map((pet) => (
            <motion.div 
              key={pet.id}
              layoutId={`pet-${pet.id}`}
              onClick={() => onPetClick(pet)}
              className="bg-white rounded-[2.5rem] overflow-hidden group border border-zinc-100 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 cursor-pointer"
            >
              <div className="relative h-[320px] overflow-hidden">
                <img 
                  src={pet.image} 
                  alt={pet.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <div className="bg-white/90 backdrop-blur-md text-zinc-900 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {pet.distance}
                  </div>
                  <div className="bg-primary text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {pet.status}
                  </div>
                </div>
                <button 
                  onClick={(e) => toggleFavorite(pet.id, e)}
                  className={`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-sm ${
                    favorites.includes(pet.id) 
                      ? 'bg-primary text-white' 
                      : 'bg-white/80 text-zinc-400 hover:text-primary'
                  }`}
                >
                  <Heart size={20} fill={favorites.includes(pet.id) ? "currentColor" : "none"} />
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/20">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-2xl font-bold font-headline text-zinc-900">{pet.name}</h3>
                          {pet.gender === 'male' ? (
                            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-[10px] font-bold">♂</div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 text-[10px] font-bold">♀</div>
                          )}
                        </div>
                        <p className="text-zinc-500 text-xs font-medium flex items-center gap-2">
                          <span>{pet.breed}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-200"></span>
                          <span>{pet.age}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">契合度</span>
                        <span className="text-xl font-bold font-mono text-zinc-900">98%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </motion.div>
  );
}

function ProfileView({ applications, favoritesCount, messagesCount, userProfile, isLoggedIn, onBack, onHomeClick, onEditProfile, onViewAllApplications, onPetClick, onViewGuide, onLogin, onLogout }: { 
  applications: Application[], 
  favoritesCount: number,
  messagesCount: number,
  userProfile: { nickname: string, age: string, city: string },
  isLoggedIn: boolean,
  onBack: () => void, 
  onHomeClick: () => void,
  onEditProfile: () => void,
  onViewAllApplications: () => void,
  onPetClick: (pet: Pet) => void,
  onViewGuide: () => void,
  onLogin: () => void,
  onLogout: () => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-32 bg-[#F9F9F7]"
    >
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:bg-zinc-100 transition-colors p-2 rounded-full active:scale-95">
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">个人中心</h1>
        </div>
        <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <SlidersHorizontal size={20} className="text-on-surface-variant" />
        </button>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        {!isLoggedIn && (
          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100 text-center">
            <h2 className="font-headline text-2xl font-black text-on-surface mb-2">未登录</h2>
            <p className="text-sm text-on-surface-variant font-medium mb-6">登录后可收藏、查看消息并提交领养申请</p>
            <button onClick={onLogin} className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-sm active:scale-95 transition-all">
              去登录
            </button>
          </section>
        )}
        {isLoggedIn && (
          <>
        {/* User Profile Header */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/10 shadow-inner">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLZcA_qQltneMIcme8av9TTGIS1pyIjae3f97BD7GTVMAOQ0sjQRvil6l0prlo6FRRJ9x7BytddBjpwrzRMDDjBomDmtd_gx04lxUM3RdOCpcj0ImNCJKw9WxlXG11tvmZIpeuyEaXXRiKVhS0jFSIlc9ftFGOBB7LqSzZ-emFx55fAtUnW5d8HHky9T5czxX-WekeZI7xHPQewHQEpcEJNMygH1soj6sD_VFhjL2cKBJNjI6KVJ7yNmfjrd56YsvLOpQZuSSQyto" 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1">
            <h2 className="font-headline text-2xl font-bold text-on-surface">{userProfile.nickname}</h2>
            <div className="flex items-center gap-2 mt-1 overflow-hidden">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0">资深领养人</span>
              <span className="text-xs text-on-surface-variant whitespace-nowrap truncate">{userProfile.age}岁 · {userProfile.city}</span>
            </div>
          </div>
          <button 
            onClick={onEditProfile}
            className="bg-zinc-100 p-2 rounded-full text-on-surface-variant hover:bg-zinc-200 transition-colors active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-center">
            <span className="block text-2xl font-black text-primary leading-none mb-1">{applications.length}</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">领养申请</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-center">
            <span className="block text-2xl font-black text-primary leading-none mb-1">{favoritesCount}</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">收藏宠物</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 text-center">
            <span className="block text-2xl font-black text-primary leading-none mb-1">{messagesCount}</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">互动消息</span>
          </div>
        </section>

        {/* My Applications Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-headline text-xl font-bold text-on-surface">我的申请</h3>
            <button onClick={onViewAllApplications} className="text-xs font-bold text-primary hover:underline">查看全部</button>
          </div>
          
          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-dashed border-zinc-200 text-center">
                <p className="text-on-surface-variant text-sm italic">暂无申请记录</p>
                <button onClick={onHomeClick} className="mt-4 text-xs font-bold text-primary">去看看宠物</button>
              </div>
            ) : (
              applications.slice(0, 3).map(app => (
                <motion.div 
                  key={app.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const pet = MOCK_PETS.find(p => p.id === app.petId);
                    if (pet) onPetClick(pet);
                  }}
                  className="bg-white p-4 rounded-3xl shadow-sm border border-zinc-100 flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm">
                    <img src={app.petImage} alt={app.petName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-on-surface">{app.petName}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === '已通过' 
                          ? 'bg-green-100 text-green-700' 
                          : app.status === '审核中' 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider mb-2">{app.petBreed}</p>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${app.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Adoption Guide Card */}
        <section className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <h3 className="font-headline text-2xl font-bold mb-2">领养指南</h3>
            <p className="text-xs text-white/70 mb-6 leading-relaxed">为新家人准备温馨的家是一段充满喜悦的旅程。让我们确保您已经准备就绪。</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
                <CheckCircle2 size={18} className="text-primary" />
                <span className="text-xs font-medium">居家环境宠物安全化</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
                <CheckCircle2 size={18} className="text-primary" />
                <span className="text-xs font-medium">预约首次宠物医生咨询</span>
              </div>
            </div>
            <button 
              onClick={onViewGuide}
              className="mt-6 w-full py-3 bg-white text-zinc-900 font-bold rounded-2xl text-sm active:scale-95 transition-all"
            >
              查看完整指南
            </button>
          </div>
          <div className="absolute -right-12 -bottom-12 opacity-10 rotate-12">
            <Home size={200} />
          </div>
        </section>

        {/* Settings List */}
        <section className="space-y-4">
          <h3 className="font-headline text-xl font-bold text-on-surface px-2">账号设置</h3>
          <div className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 overflow-hidden divide-y divide-zinc-50">
            <button className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Bell size={18} />
                </div>
                <span className="font-semibold text-sm text-on-surface">通知偏好设置</span>
              </div>
              <ChevronRight className="text-zinc-300" size={18} />
            </button>
            <button className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-50 rounded-xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <HelpCircle size={18} />
                </div>
                <span className="font-semibold text-sm text-on-surface">帮助中心</span>
              </div>
              <ChevronRight className="text-zinc-300" size={18} />
            </button>
            <button onClick={onLogout} className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-50 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <LogOut size={18} />
                </div>
                <span className="font-semibold text-sm text-red-500">退出登录</span>
              </div>
            </button>
          </div>
        </section>
          </>
        )}
      </main>
    </motion.div>
  );
}

function AdoptionGuideView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#F9F9F7] min-h-screen pb-20"
    >
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:bg-zinc-100 transition-colors p-2 rounded-full active:scale-95">
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">领养指南</h1>
        </div>
        <div className="w-8 h-8"></div>
      </header>

      <main className="px-6 py-10 max-w-2xl mx-auto space-y-10">
        <section className="text-center space-y-4">
          <div className="inline-block p-3 bg-primary/10 rounded-3xl mb-2">
            <Heart size={32} className="text-primary" fill="currentColor" />
          </div>
          <h2 className="font-headline text-3xl font-black text-on-surface leading-tight tracking-tight">宠物领养APP<br/><span className="text-primary">精简版领养指南</span></h2>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed px-4 italic">
            “领养即责任，请务必认真阅读，用心守护每一位毛孩子的一生。”
          </p>
        </section>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">01</span>
              一、领养前准备
            </h3>
            <ul className="space-y-4">
              {[
                '确认自身有充足时间、稳定经济能力及合适居住环境，家人/室友达成养宠共识。',
                '根据自身生活节奏选择适配宠物（狗狗需陪伴遛弯，猫咪相对独立，小型宠物需了解专属饲养知识）。',
                '提前备好基础用品（粮食、食盆、水盆及对应宠物专用品）。'
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl text-white">
            <h3 className="font-headline text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">02</span>
              二、APP领养流程
            </h3>
            <div className="space-y-6">
              {[
                '注册登录APP，完善个人养宠相关信息，提交领养意向。',
                '浏览宠物信息，与救助方在线沟通，确认宠物适配度。',
                '配合救助方审核（线上提交居住证明、饲养计划等）。',
                '审核通过后，签订电子领养协议，按需缴纳相关费用（疫苗、绝育费等）。',
                '约定时间接宠，全程做好防护，减少宠物应激。'
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="font-mono text-primary font-bold text-lg leading-none">{i + 1}.</span>
                  <p className="text-sm text-white/80 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">03</span>
              三、领养后须知
            </h3>
            <ul className="space-y-4">
              {[
                '接宠后1-2周为适应期，提供安静环境，规律喂食，暂不洗澡。',
                '定期带宠物接种疫苗、驱虫、体检，适龄做好绝育。',
                '密切关注宠物状态，出现异常及时就医，终身履行饲养责任，不抛弃、不虐待。'
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="text-center pt-6">
          <button 
            onClick={onBack}
            className="px-10 py-4 bg-zinc-900 text-white font-headline font-bold rounded-full shadow-lg active:scale-95 transition-all"
          >
            我已了解
          </button>
        </footer>
      </main>
    </motion.div>
  );
}

function ApplicationsView({ 
  applications, 
  onBack, 
  onPetClick 
}: { 
  applications: Application[], 
  onBack: () => void, 
  onPetClick: (pet: Pet) => void 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-32 bg-[#F9F9F7] min-h-screen"
    >
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:bg-zinc-100 transition-colors p-2 rounded-full active:scale-95">
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">我的申请</h1>
        </div>
        <div className="w-8 h-8"></div>
      </header>

      <main className="px-6 py-8 space-y-4 max-w-2xl mx-auto">
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <Clock size={48} className="mb-4 text-zinc-300" />
            <p className="font-medium text-zinc-400">暂无申请记录</p>
          </div>
        ) : (
          applications.map((app) => (
            <motion.div 
              key={app.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const pet = MOCK_PETS.find(p => p.id === app.petId);
                if (pet) onPetClick(pet);
              }}
              className="bg-white p-5 rounded-[2rem] shadow-sm border border-zinc-100 flex items-center gap-5 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm shrink-0">
                <img src={app.petImage} alt={app.petName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-lg text-on-surface truncate">{app.petName}</h4>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    app.status === '已通过' 
                      ? 'bg-green-100 text-green-700' 
                      : app.status === '审核中' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-3">{app.petBreed}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                    <span>申请进度</span>
                    <span>{app.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${app.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${app.status === '已通过' ? 'bg-green-500' : 'bg-primary'}`}
                    ></motion.div>
                  </div>
                  <p className="text-[10px] text-primary font-bold mt-1 italic">“{app.milestone}”</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </main>
    </motion.div>
  );
}

function PetDetailView({ 
  pet, 
  onBack, 
  onApply,
  applicationStatus 
}: { 
  pet: Pet, 
  onBack: () => void, 
  onApply: () => void,
  applicationStatus?: '审核中' | '已通过' | '未通过'
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32"
    >
      <nav className="sticky top-0 w-full z-40 flex items-center justify-between px-6 py-4 bg-surface/90 backdrop-blur-md border-b border-zinc-100">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 text-on-surface hover:bg-zinc-200 active:scale-95 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">{pet.name}</h1>
        <div className="w-8 h-8"></div> {/* Spacer for capsule */}
      </nav>

      <section className="relative h-[530px] w-full overflow-hidden">
        <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent"></div>
        <div className="absolute bottom-8 left-8 right-8">
          <span className="bg-primary-container text-white px-4 py-1.5 rounded-full font-headline text-xs font-bold tracking-widest uppercase mb-3 inline-block">
            {pet.status}
          </span>
          <h2 className="font-headline text-5xl font-black text-on-surface leading-none tracking-tighter">{pet.name}</h2>
          <div className="flex items-center gap-2 mt-2 text-on-surface-variant">
            <MapPin className="text-primary" size={20} />
            <span className="font-medium">{pet.location} (距离 {pet.distance})</span>
          </div>
        </div>
      </section>

      <div className="px-6 -mt-4 relative z-10">
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="bg-white p-4 rounded-lg editorial-shadow flex flex-col items-center justify-center text-center">
            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-1">年龄</span>
            <span className="font-headline font-bold text-lg text-primary">{pet.age}</span>
          </div>
          <div className="bg-white p-4 rounded-lg editorial-shadow flex flex-col items-center justify-center text-center">
            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-1">性别</span>
            <span className="font-headline font-bold text-lg text-primary">{pet.gender === 'male' ? '公' : '母'}</span>
          </div>
          <div className="bg-white p-4 rounded-lg editorial-shadow flex flex-col items-center justify-center text-center">
            <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-1">体重</span>
            <span className="font-headline font-bold text-lg text-primary">{pet.weight || '未知'}</span>
          </div>
        </div>

        <section className="mb-10">
          <h3 className="font-headline text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary-container rounded-full"></span>
            关于 {pet.name}
          </h3>
          <div className="bg-surface-container-low p-6 rounded-lg leading-relaxed text-on-surface-variant">
            <p>{pet.description}</p>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="font-headline text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-tertiary-container rounded-full"></span>
            健康与安全
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-lg border border-outline-variant/10 flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Stethoscope size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">疫苗接种</p>
                <p className="text-xs text-on-surface-variant">已完成</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-outline-variant/10 flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <X size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">绝育状态</p>
                <p className="text-xs text-on-surface-variant">已绝育</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-outline-variant/10 flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Check size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">芯片植入</p>
                <p className="text-xs text-on-surface-variant">已注册</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-outline-variant/10 flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <ShoppingBag size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">饮食习惯</p>
                <p className="text-xs text-on-surface-variant">标准干粮</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="font-headline text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-secondary-container rounded-full"></span>
            相处兼容性
          </h3>
          <div className="flex flex-wrap gap-2">
            {pet.tags.map(tag => (
              <span key={tag} className="bg-secondary-container text-on-secondary-container px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <Check size={16} />
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-12 bg-primary-dim p-6 rounded-xl text-white">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h4 className="font-headline font-bold text-lg leading-tight">领养意向</h4>
              <p className="text-xs opacity-80">本周已有 4 人提交了 {pet.name} 的领养申请</p>
            </div>
            <span className="font-headline font-bold text-2xl">极高</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-[85%] bg-gradient-to-r from-primary-container to-tertiary rounded-full"></div>
          </div>
        </section>
      </div>

      <footer className="sticky bottom-0 w-full bg-white/95 backdrop-blur-xl px-6 py-6 z-50 border-t border-zinc-100">
        {applicationStatus === '审核中' ? (
          <button 
            disabled
            className="w-full bg-zinc-400 text-white font-headline font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Clock size={20} />
            领养审核中
          </button>
        ) : applicationStatus === '已通过' ? (
          <button 
            disabled
            className="w-full bg-green-600 text-white font-headline font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <CheckCircle2 size={20} />
            领养已通过
          </button>
        ) : (
          <button 
            onClick={onApply}
            className="w-full bg-zinc-900 text-white font-headline font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Heart size={20} fill="currentColor" />
            开始领养申请
          </button>
        )}
      </footer>
    </motion.div>
  );
}

function ApplicationFormView({ pet, draft, onUpdateDraft, onBack, onComplete }: { 
  pet: Pet | null, 
  draft: DraftApplication, 
  onUpdateDraft: (draft: DraftApplication) => void, 
  onBack: () => void, 
  onComplete: () => void 
}) {
  const [step, setStep] = useState(1); // Always start at step 1 as per user request
  const [livingType, setLivingType] = useState(draft.livingType);
  const [outdoorSpace, setOutdoorSpace] = useState(draft.outdoorSpace);
  const [timeWithPet, setTimeWithPet] = useState(draft.timeWithPet);
  const [familyMembers, setFamilyMembers] = useState<string[]>(draft.familyMembers);
  const [experience, setExperience] = useState(draft.experience);

  const saveProgress = (newStep?: number) => {
    onUpdateDraft({
      step: newStep ?? step,
      livingType,
      outdoorSpace,
      timeWithPet,
      familyMembers,
      experience
    });
  };

  const nextStep = () => {
    const next = Math.min(step + 1, 4);
    setStep(next);
    saveProgress(next);
  };

  const prevStep = () => {
    const prev = Math.max(step - 1, 1);
    setStep(prev);
    saveProgress(prev);
  };

  const handleSaveAndExit = () => {
    saveProgress();
    onBack();
  };

  const toggleFamilyMember = (member: string) => {
    setFamilyMembers(prev => 
      prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="pb-32"
    >
      <header className="sticky top-0 left-0 w-full z-40 bg-surface/90 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <button onClick={handleSaveAndExit} className="hover:bg-zinc-100 transition-colors p-2 rounded-full active:scale-95">
          <X size={20} className="text-on-surface" />
        </button>
        <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">领养申请</h1>
        <div className="w-8 h-8"></div> {/* Spacer for capsule */}
      </header>

      <main className="mt-20 px-6 w-full max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-2 tracking-tight">您与 {pet?.name || '宠物'} 的旅程开始了</h2>
          <p className="text-on-surface-variant font-medium">步骤 {step} / 4：{['居住情况', '生活方式', '经验背景', '确认提交'][step - 1]}</p>
          <div className="mt-8 bg-surface-container h-3 w-full rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: "25%" }}
              animate={{ width: `${(step / 4) * 100}%` }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-tertiary rounded-full"
            ></motion.div>
          </div>
          <div className="flex justify-between mt-4">
            {['居住情况', '生活方式', '经验背景', '确认提交'].map((label, i) => (
              <span key={label} className={`text-[10px] font-headline font-bold uppercase tracking-widest ${i + 1 === step ? 'text-primary' : 'text-outline'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.section 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-secondary-container p-2 rounded-lg">
                  <MapPin className="text-on-secondary-container" size={20} />
                </div>
                <h3 className="font-headline text-xl font-bold">居住环境</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative group cursor-pointer block">
                  <input 
                    type="radio" 
                    name="living" 
                    className="peer sr-only" 
                    checked={livingType === '独立房屋'} 
                    onChange={() => setLivingType('独立房屋')}
                  />
                  <div className="p-6 rounded-lg bg-surface-container-low border-2 border-transparent peer-checked:border-primary-fixed peer-checked:bg-white transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <Home className="text-primary" size={24} />
                      <div className="w-5 h-5 rounded-full border-2 border-outline peer-checked:border-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                    </div>
                    <div className="font-headline font-bold text-on-surface">独立房屋</div>
                    <div className="text-sm text-on-surface-variant mt-1">宽敞的环境，通常带有院子。</div>
                  </div>
                </label>
                <label className="relative group cursor-pointer block">
                  <input 
                    type="radio" 
                    name="living" 
                    className="peer sr-only" 
                    checked={livingType === '公寓'} 
                    onChange={() => setLivingType('公寓')}
                  />
                  <div className="p-6 rounded-lg bg-surface-container-low border-2 border-transparent peer-checked:border-primary-fixed peer-checked:bg-white transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <Plus className="text-primary" size={24} />
                      <div className="w-5 h-5 rounded-full border-2 border-outline flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                    </div>
                    <div className="font-headline font-bold text-on-surface">公寓</div>
                    <div className="text-sm text-on-surface-variant mt-1">舒适的城市生活，优先考虑规律散步。</div>
                  </div>
                </label>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-bold font-headline mb-2 text-on-surface-variant ml-1">户外空间</label>
                <select 
                  value={outdoorSpace}
                  onChange={(e) => setOutdoorSpace(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-DEFAULT px-4 py-4 focus:ring-2 focus:ring-primary-fixed transition-all"
                >
                  <option>全封闭院子</option>
                  <option>部分封闭院子</option>
                  <option>无院子，但靠近公园</option>
                  <option>无户外空间</option>
                </select>
                <p className="mt-2 text-xs text-on-surface-variant italic ml-1 flex items-center gap-1">
                  <Info size={14} />
                  温馨提示：封闭式院子非常适合精力充沛的狗狗！
                </p>
              </div>
            </motion.section>
          )}

          {step === 2 && (
            <motion.section 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-secondary-container p-2 rounded-lg">
                  <Heart className="text-on-secondary-container" size={20} />
                </div>
                <h3 className="font-headline text-xl font-bold">生活方式</h3>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold font-headline mb-3 text-on-surface-variant ml-1">每天能花多少时间陪伴宠物？</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['1-2 小时', '3-5 小时', '5-8 小时', '全天候'].map(time => (
                      <button 
                        key={time} 
                        onClick={() => setTimeWithPet(time)}
                        className={`p-4 rounded-lg border-2 transition-all text-sm font-bold ${timeWithPet === time ? 'border-primary-fixed bg-white' : 'bg-surface-container-low border-transparent hover:border-primary-fixed hover:bg-white'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold font-headline mb-3 text-on-surface-variant ml-1">家庭成员构成</label>
                  <div className="space-y-3">
                    {['有小孩 (12岁以下)', '有其他宠物', '独居', '与室友同住'].map(option => (
                      <label key={option} className="flex items-center gap-3 p-4 bg-surface-container-low rounded-lg cursor-pointer hover:bg-white transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-outline text-primary focus:ring-primary" 
                          checked={familyMembers.includes(option)}
                          onChange={() => toggleFamilyMember(option)}
                        />
                        <span className="font-bold text-on-surface">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {step === 3 && (
            <motion.section 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-secondary-container p-2 rounded-lg">
                  <User size={20} className="text-on-secondary-container" />
                </div>
                <h3 className="font-headline text-xl font-bold">经验背景</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold font-headline mb-2 text-on-surface-variant ml-1">请告诉我们您以往的养宠经历</label>
                  <textarea 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-DEFAULT px-4 py-4 focus:ring-2 focus:ring-primary-fixed transition-all placeholder:text-outline-variant" 
                    placeholder="例如：我从小和金毛猎犬一起长大，并曾寄养过高龄猫..." 
                    rows={6}
                  ></textarea>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-primary">
                  <div className="flex gap-4">
                    <div className="p-2 bg-primary/10 rounded-full shrink-0">
                      <Info className="text-primary" size={20} />
                    </div>
                    <div>
                      <div className="font-headline font-bold text-primary-dim">专业建议</div>
                      <p className="text-sm text-on-surface-variant">提及特定品种或特殊护理经验（如喂药等）将有助于我们为您和 {pet?.name || '宠物'} 的需求进行更好的匹配。</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {step === 4 && (
            <motion.section 
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-12 text-center"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="font-headline text-3xl font-bold">一切准备就绪！</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  感谢您对 {pet?.name || '宠物'} 的关注。提交申请后，我们的团队将在 3-5 个工作日内审核您的资料，并与您联系安排视频面试。
                </p>
                <div className="w-full bg-surface-container-low p-6 rounded-lg text-left space-y-4">
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-sm text-on-surface-variant">领养对象</span>
                    <span className="font-bold">{pet?.name || '宠物'} ({pet?.breed || '未知品种'})</span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                    <span className="text-sm text-on-surface-variant">申请人</span>
                    <span className="font-bold">艾琳娜·理查森</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-on-surface-variant">当前状态</span>
                    <span className="font-bold text-primary">待提交</span>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <div className="pt-12 flex flex-col items-center gap-6">
          <div className="flex gap-4 w-full">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="flex-1 bg-surface-container-highest text-on-surface font-headline font-extrabold py-4 px-8 rounded-full active:scale-95 transition-all duration-200"
              >
                上一步
              </button>
            )}
            <button 
              onClick={step === 4 ? onComplete : nextStep}
              className="flex-[2] bg-primary-container text-white font-headline font-extrabold py-4 px-8 rounded-full shadow-lg active:scale-95 transition-all duration-200 text-lg hover:bg-primary-fixed-dim"
            >
              {step === 4 ? '确认并提交申请' : '继续下一步'}
            </button>
          </div>
          <button onClick={handleSaveAndExit} className="text-on-surface-variant font-bold hover:text-primary transition-colors flex items-center gap-2">
            <Save size={18} />
            保存并退出
          </button>
        </div>
      </main>
    </motion.div>
  );
}
