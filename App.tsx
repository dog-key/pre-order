import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  AppView, 
  Restaurant, 
  MenuItem, 
  CartItem, 
  Order, 
  OrderStatus, 
  Category 
} from './types';
import { fetchRestaurants } from './services/geminiService';
import { 
  HomeIcon, 
  SearchIcon, 
  ShoppingBagIcon, 
  UserIcon, 
  ClockIcon, 
  QRCodeIcon,
  VegIcon,
  NonVegIcon
} from './components/Icons';

// --- Components ---

// 1. Splash Screen
const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-brand-500 flex flex-col items-center justify-center text-white z-50">
      <div className="text-6xl mb-4">🥡</div>
      <h1 className="text-4xl font-bold tracking-tight">QuickPick</h1>
      <p className="mt-2 text-brand-100 text-lg">Save Time. Just Pick & Go.</p>
      <div className="mt-8 animate-pulse">
        <div className="h-1 w-32 bg-brand-100 rounded-full overflow-hidden">
          <div className="h-full bg-white w-1/2 animate-[shimmer_1s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

// 2. Navigation Bar
const BottomNav: React.FC<{ 
  currentView: AppView, 
  setView: (v: AppView) => void, 
  cartCount: number 
}> = ({ 
  currentView, 
  setView, 
  cartCount 
}) => {
  const navItems = [
    { view: AppView.HOME, icon: HomeIcon, label: 'Home' },
    { view: AppView.ORDERS, icon: QRCodeIcon, label: 'Orders' },
    { view: AppView.PROFILE, icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-40 pb-safe">
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => setView(item.view)}
          className={`flex flex-col items-center space-y-1 ${currentView === item.view ? 'text-brand-600' : 'text-gray-400'}`}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
      {/* Floating Cart Button if items exist */}
      {cartCount > 0 && currentView !== AppView.CART && (
        <button 
          onClick={() => setView(AppView.CART)}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-brand-600 text-white p-4 rounded-full shadow-lg border-4 border-gray-50 flex items-center justify-center"
        >
          <ShoppingBagIcon className="w-6 h-6" />
          <span className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {cartCount}
          </span>
        </button>
      )}
    </div>
  );
};

// 3. Restaurant Card
const RestaurantCard: React.FC<{ data: Restaurant, onClick: () => void }> = ({ data, onClick }) => (
  <div onClick={onClick} className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 active:scale-[0.98] transition-transform duration-200 cursor-pointer border border-gray-100">
    <div className="relative h-40 bg-gray-200">
      <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
      <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
        {data.distance}
      </div>
      <div className="absolute top-2 left-2 bg-brand-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
        Pickup
      </div>
    </div>
    <div className="p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-gray-800">{data.name}</h3>
        <div className="bg-green-700 text-white text-xs px-1.5 py-0.5 rounded flex items-center">
          {data.rating} ★
        </div>
      </div>
      <p className="text-gray-500 text-sm mt-1 truncate">{data.cuisine}</p>
      <p className="text-gray-400 text-xs mt-1">{data.address}</p>
    </div>
  </div>
);

// 4. Menu Item
const MenuItemCard: React.FC<{ item: MenuItem, onAdd: () => void }> = ({ item, onAdd }) => (
  <div className="flex justify-between items-start py-4 border-b border-gray-100 last:border-0">
    <div className="flex-1 pr-4">
      <div className="flex items-center space-x-2">
        {item.isVeg ? <VegIcon /> : <NonVegIcon />}
        <h4 className="font-semibold text-gray-800">{item.name}</h4>
      </div>
      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>
      <div className="mt-2 font-medium text-gray-900">₹{item.price}</div>
    </div>
    <button 
      onClick={(e) => { e.stopPropagation(); onAdd(); }}
      className="bg-white text-brand-600 border border-brand-200 px-4 py-1.5 rounded-lg font-bold text-sm shadow-sm active:bg-brand-50 hover:bg-brand-50"
    >
      ADD +
    </button>
  </div>
);

// 5. Merchant Order Card
const MerchantOrderCard: React.FC<{ order: Order, onUpdateStatus: (id: string, status: OrderStatus) => void }> = ({ order, onUpdateStatus }) => {
  const isPending = order.status === OrderStatus.PENDING;
  const isPreparing = order.status === OrderStatus.PREPARING;
  const isReady = order.status === OrderStatus.READY;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 shadow-sm">
      <div className="flex justify-between mb-2">
        <span className="font-bold text-gray-800">Order #{order.id.slice(-4)}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold 
          ${order.status === OrderStatus.READY ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {order.status}
        </span>
      </div>
      <div className="text-sm text-gray-500 mb-2">Pickup: {new Date(order.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      <div className="space-y-1 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span>{item.quantity} x {item.name}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="border-t pt-2 mt-2 flex justify-between font-bold">
          <span>Total</span>
          <span>₹{order.totalAmount}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {isPending && (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.PREPARING)}
            className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-medium text-sm"
          >
            Accept Order
          </button>
        )}
        {isPreparing && (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.READY)}
            className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-medium text-sm"
          >
            Mark Ready
          </button>
        )}
        {isReady && (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.COMPLETED)}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium text-sm"
          >
            Complete (Scan)
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.SPLASH);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('Food');
  const [userLocation, setUserLocation] = useState<string>('Detecting...');
  const [isMerchantMode, setIsMerchantMode] = useState(false);

  // Initialize Data
  useEffect(() => {
    // Simulate detecting location
    setTimeout(() => setUserLocation('Banjara Hills, Hyderabad'), 1000);
    
    // Load initial restaurants
    loadRestaurants('Banjara Hills, Hyderabad', 'Food');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRestaurants = async (loc: string, cat: string) => {
    setLoading(true);
    const data = await fetchRestaurants(loc, cat);
    setRestaurants(data);
    setLoading(false);
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    setCart(prev => {
      // Logic: Only allow items from same restaurant for simplicity
      const isSameRestaurant = prev.length === 0 || prev[0].restaurantId === restaurant.id;
      if (!isSameRestaurant) {
        if (!window.confirm("Start a new basket? Adding this item will clear your current cart from another shop.")) {
          return prev;
        }
        return [{ ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
      }

      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const placeOrder = (pickupTimeOffsetMinutes: number) => {
    if (cart.length === 0) return;

    const pickupTime = new Date();
    pickupTime.setMinutes(pickupTime.getMinutes() + pickupTimeOffsetMinutes);

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      userId: 'user-1',
      restaurantId: cart[0].restaurantId,
      restaurantName: cart[0].restaurantName,
      items: [...cart],
      totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: OrderStatus.PENDING,
      pickupTime: pickupTime.toISOString(),
      createdAt: new Date().toISOString(),
      qrCodeData: `QP-${Math.random().toString(36).substring(7)}`
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setView(AppView.ORDERS);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // --- Views ---

  if (view === AppView.SPLASH) {
    return <SplashScreen onFinish={() => setView(AppView.HOME)} />;
  }

  // Merchant View Logic
  if (isMerchantMode) {
    // Filter orders for the "current merchant" (mocking the first restaurant in list or just showing all)
    const merchantOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.REJECTED);
    
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Merchant Dashboard</h2>
            <p className="text-sm text-green-600 font-medium">Online • Accepting Orders</p>
          </div>
          <button onClick={() => setIsMerchantMode(false)} className="text-xs bg-gray-200 px-3 py-1 rounded">Switch to User</button>
        </header>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold">{merchantOrders.length}</div>
                <div className="text-xs text-gray-500">Active Orders</div>
             </div>
             <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold">₹{orders.reduce((acc, o) => o.status === OrderStatus.COMPLETED ? acc + o.totalAmount : acc, 0)}</div>
                <div className="text-xs text-gray-500">Today's Sales</div>
             </div>
          </div>

          <h3 className="font-bold text-lg mb-4">Incoming Orders</h3>
          {merchantOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No active orders right now.</div>
          ) : (
            merchantOrders.map(order => (
              <MerchantOrderCard key={order.id} order={order} onUpdateStatus={updateOrderStatus} />
            ))
          )}
        </div>
      </div>
    );
  }

  // User Views

  return (
    <div className="min-h-screen bg-slate-50 pb-20 max-w-md mx-auto relative shadow-2xl">
      
      {/* --- HEADER (Home Only) --- */}
      {view === AppView.HOME && (
        <header className="bg-white p-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <span className="mr-1">📍</span>
            <span className="truncate max-w-[200px]">{userLocation}</span>
          </div>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-brand-600 tracking-tight">QuickPick</h1>
            <button className="p-2 bg-gray-100 rounded-full">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <input 
              type="text" 
              placeholder="Search for 'Biryani' or 'Cake'" 
              className="w-full bg-gray-100 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-200"
            />
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          </div>

          {/* Categories */}
          <div className="flex space-x-4 mt-4 overflow-x-auto hide-scrollbar pb-2">
            {['Food', 'Groceries', 'Pharmacy', 'Cafe'].map(cat => (
              <button 
                key={cat}
                onClick={() => { setActiveCategory(cat as Category); loadRestaurants(userLocation, cat); }}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${activeCategory === cat ? 'bg-brand-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>
      )}

      {/* --- HOME VIEW --- */}
      {view === AppView.HOME && (
        <main className="p-4">
          <h2 className="font-bold text-lg mb-4 text-gray-800">Nearby & Pickup Ready</h2>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            restaurants.map(r => (
              <RestaurantCard 
                key={r.id} 
                data={r} 
                onClick={() => { setSelectedRestaurant(r); setView(AppView.RESTAURANT_DETAILS); }} 
              />
            ))
          )}
        </main>
      )}

      {/* --- RESTAURANT DETAILS VIEW --- */}
      {view === AppView.RESTAURANT_DETAILS && selectedRestaurant && (
        <div className="bg-white min-h-screen">
          <div className="relative h-56">
             <img src={selectedRestaurant.imageUrl} className="w-full h-full object-cover" />
             <button 
               onClick={() => setView(AppView.HOME)} 
               className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow-md"
             >
               ← Back
             </button>
          </div>
          <div className="p-4 -mt-6 relative bg-white rounded-t-3xl border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{selectedRestaurant.name}</h1>
                <p className="text-gray-500 text-sm">{selectedRestaurant.cuisine}</p>
                <p className="text-gray-400 text-xs mt-1">📍 {selectedRestaurant.address}</p>
              </div>
              <div className="bg-green-700 text-white px-2 py-1 rounded-lg text-sm font-bold shadow-sm">
                {selectedRestaurant.rating} ★
              </div>
            </div>
          </div>
          <div className="p-4 pb-24">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Menu</h3>
            {selectedRestaurant.menu.map(item => (
              <MenuItemCard 
                key={item.id} 
                item={item} 
                onAdd={() => addToCart(item, selectedRestaurant)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* --- CART VIEW --- */}
      {view === AppView.CART && (
        <div className="bg-white min-h-screen flex flex-col">
          <header className="p-4 border-b flex items-center">
            <button onClick={() => setView(AppView.HOME)} className="mr-4">←</button>
            <h1 className="font-bold text-lg">Your Cart</h1>
          </header>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingBagIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Your cart is empty</p>
                <button onClick={() => setView(AppView.HOME)} className="mt-4 text-brand-600 font-bold">Browse Shops</button>
              </div>
            ) : (
              <>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-6 text-sm text-orange-800">
                  ⚡ <strong>Pickup Order:</strong> No delivery fees. No hidden charges.
                </div>

                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                       <div>
                          <div className="flex items-center space-x-2">
                            {item.isVeg ? <VegIcon /> : <NonVegIcon />}
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">₹{item.price} x {item.quantity}</div>
                       </div>
                       <div className="flex items-center space-x-3">
                         <button onClick={() => removeFromCart(item.id)} className="text-gray-400 border px-2 rounded">-</button>
                         <span className="font-bold">₹{item.price * item.quantity}</span>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-300 my-6"></div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span>₹{cart.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
                </div>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 bg-white border-t shadow-inner">
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
                 <div className="flex space-x-2 overflow-x-auto pb-2">
                   {[15, 30, 45, 60].map(mins => (
                     <button 
                        key={mins} 
                        className="flex-shrink-0 px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-brand-50 focus:border-brand-500 focus:text-brand-700"
                        onClick={() => placeOrder(mins)}
                     >
                       In {mins} mins
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* --- ORDERS VIEW --- */}
      {view === AppView.ORDERS && (
        <div className="p-4 min-h-screen bg-gray-50">
          <h1 className="text-2xl font-bold mb-6">Your Orders</h1>
          {orders.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">No active orders.</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                 <div className="p-4 border-b border-gray-100 flex justify-between bg-gray-50">
                    <div>
                      <h3 className="font-bold text-gray-800">{order.restaurantName}</h3>
                      <p className="text-xs text-gray-500">Order #{order.id}</p>
                    </div>
                    <div className="text-right">
                       <span className={`text-xs font-bold px-2 py-1 rounded 
                         ${order.status === OrderStatus.READY ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                         {order.status}
                       </span>
                    </div>
                 </div>
                 
                 <div className="p-6 flex flex-col items-center justify-center border-b border-gray-100 bg-white">
                    {order.status !== OrderStatus.COMPLETED && (
                       <>
                         <div className="w-40 h-40 bg-gray-900 rounded-lg flex items-center justify-center text-white mb-4 relative overflow-hidden">
                           {/* Simulated QR Pattern */}
                           <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover"></div>
                           <span className="relative z-10 font-mono text-xl font-bold tracking-widest">{order.id.split('-')[1]}</span>
                         </div>
                         <p className="text-sm text-gray-500 text-center">Show this code at the counter</p>
                       </>
                    )}
                 </div>

                 <div className="p-4">
                    <div className="flex items-center text-sm text-gray-700 mb-2">
                       <ClockIcon className="w-4 h-4 mr-2 text-brand-500" />
                       Pickup at <span className="font-bold ml-1">{new Date(order.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t text-sm">
                       {order.items.map(item => (
                         <div key={item.id} className="flex justify-between text-gray-500 mb-1">
                           <span>{item.quantity} x {item.name}</span>
                           <span>₹{item.price * item.quantity}</span>
                         </div>
                       ))}
                       <div className="flex justify-between font-bold mt-2">
                         <span>Total Paid</span>
                         <span>₹{order.totalAmount}</span>
                       </div>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- PROFILE VIEW --- */}
      {view === AppView.PROFILE && (
        <div className="p-4 bg-white min-h-screen">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-2xl">😎</div>
            <div>
              <h2 className="text-xl font-bold">John Doe</h2>
              <p className="text-gray-500 text-sm">+91 98765 43210</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <button className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-gray-100 font-medium">Payment Methods</button>
            <button className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-gray-100 font-medium">Past Orders</button>
            <button className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-gray-100 font-medium">Help & Support</button>
            
            <div className="pt-8 mt-8 border-t">
              <p className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">For Demo Purpose</p>
              <button 
                onClick={() => setIsMerchantMode(true)} 
                className="w-full text-center p-3 rounded-lg border-2 border-dashed border-brand-300 text-brand-600 font-bold hover:bg-brand-50"
              >
                Switch to Merchant Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation (User Mode Only) */}
      {!isMerchantMode && view !== AppView.SPLASH && view !== AppView.RESTAURANT_DETAILS && (
        <BottomNav currentView={view} setView={setView} cartCount={cart.reduce((a, b) => a + b.quantity, 0)} />
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);
root.render(<App />);