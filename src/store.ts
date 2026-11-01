import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getProductQuantity, isLowStock } from './logic/inventory';

export interface OrderLine {
  productId: number;
  title: string;
  image: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  placedAt: number;
  count: number;
  subtotal: number;
  rigDiscount?: number;
  promoDiscount?: number;
  discountTotal?: number;
  promoCode?: string | null;
  tax: number;
  total: number;
  lines: OrderLine[];
  shippingName: string;
  shippingAddress: string;
  paymentMethod: string;
  status?: string;
  amountPaid: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  avatarColor: string;
  billEmail: string | null;
  role: string;
  cart: Record<string, number>;
  orders: Order[];
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  ratingRate: number;
  ratingCount: number;
  addedByName: string;
  addedByColor: string;
  addedByEmail: string | null;
  official: boolean;
  createdAt: number;
  takenDown: boolean;
  quantity: number;
  stock: number;
  lowStock?: boolean;
}

export interface Application {
  id: number;
  applicantEmail: string;
  applicantName: string;
  workplace: string;
  idCardImage: string;
  note: string;
  status: string;
  submittedAt: number;
  decidedAt: number;
}

export interface Report {
  id: number;
  productId: number;
  productTitle: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  note: string;
  status: string;
  createdAt: number;
}

export interface ChatMessage {
  id: number;
  channel: 'general' | 'rig-builds' | 'price-drops';
  senderName: string;
  senderEmail: string;
  senderRole: string;
  senderColor: string;
  text: string;
  productId: number | null;
  productTitle?: string | null;
  productPrice?: number | null;
  productSku?: string | null;
  productImage?: string | null;
  createdAt: number;
}

export interface StoreData {
  nextId: number;
  nextProductId: number;
  nextApplicationId: number;
  nextReportId: number;
  nextMessageId?: number;
  users: User[];
  sessions: Record<string, string>;
  products: Product[];
  applications: Application[];
  reports: Report[];
  messages?: ChatMessage[];
}

const DATA_FILE = path.resolve(process.cwd(), 'voltbox-data.json');
const SEED_PRODUCTS_FILE = path.resolve(process.cwd(), 'src/main/resources/seed-products.json');
const BRAND_COLOR = '#ffd23f';
const COLORS = ['#ffd23f', '#4dabf7', '#51cf66', '#ff6b6b', '#cc5de8', '#ff922b', '#20c997', '#f06595'];

export class Store {
  private users: User[] = [];
  private nextId = 1;
  private products: Product[] = [];
  private nextProductId = 1;
  private applications: Application[] = [];
  private nextApplicationId = 1;
  private reports: Report[] = [];
  private nextReportId = 1;
  private messages: ChatMessage[] = [];
  private nextMessageId = 1;
  private sessions: Record<string, string> = {};

  constructor() {
    this.load();
  }

  public load(): void {
    if (!fs.existsSync(DATA_FILE)) {
      this.seed();
      return;
    }
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw) as Partial<StoreData>;
      this.users = Array.isArray(data.users) ? data.users : [];
      this.sessions = data.sessions && typeof data.sessions === 'object' ? data.sessions : {};
      this.products = Array.isArray(data.products) ? data.products : [];
      this.applications = Array.isArray(data.applications) ? data.applications : [];
      this.reports = Array.isArray(data.reports) ? data.reports : [];
      this.messages = Array.isArray(data.messages) ? data.messages : [];
      this.nextId = Math.max(data.nextId || 1, 1);
      this.nextProductId = Math.max(data.nextProductId || 1, 1);
      this.nextApplicationId = Math.max(data.nextApplicationId || 1, 1);
      this.nextReportId = Math.max(data.nextReportId || 1, 1);
      this.nextMessageId = Math.max(data.nextMessageId || 1, 1);

      // Ensure every product has explicit quantity, stock,lowStock fields, and reliable image URLs
      let updated = false;
      for (const p of this.products) {
        let qty = getProductQuantity(p);
        if (p.id === 19 && qty < 2) {
          qty = 2;
          p.quantity = 2;
          p.stock = 2;
          updated = true;
        }
        if (p.quantity !== qty || p.stock !== qty || p.lowStock !== isLowStock({ quantity: qty })) {
          p.quantity = qty;
          p.stock = qty;
          p.lowStock = isLowStock({ quantity: qty });
          updated = true;
        }
        if (p.image && p.image.includes('gameloot.in')) {
          if (p.id === 23) {
            p.image = '/images/ssd.jpg';
          } else {
            p.image = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80';
          }
          updated = true;
        }
        if (p.id === 26 && (!p.image || p.image.includes('designinfo.in'))) {
          p.image = '/src/assets/images/product_ps5_controller_1793511428886.jpg';
          updated = true;
        }
        // Enrich existing items that had blank descriptions or 0 ratings
        if (!p.description) {
          const defaultDescs: Record<number, { desc: string; rate: number; count: number }> = {
            19: { desc: 'Flagship 32GB GDDR7 Blackwell GPU with triple-fan vapor chamber cooling and PCIe 5.0 interface.', rate: 4.9, count: 68 },
            20: { desc: '16-Core / 32-Thread Zen 5 desktop processor with 5.7 GHz boost clock and 80MB cache for AM5.', rate: 4.8, count: 94 },
            21: { desc: '14+2+1 Duet Rail VRM ATX motherboard with PCIe 5.0 M.2 slots, DDR5-7200+ support, and Wi-Fi 7.', rate: 4.7, count: 47 },
            22: { desc: 'High-speed 1TB NVMe M.2 solid state drive with DRAM cache and 7,450 MB/s sequential reads.', rate: 4.8, count: 116 },
            23: { desc: 'Reliable 1TB 3.5-inch SATA III desktop storage drive for bulk project archives and backups.', rate: 4.5, count: 61 },
            24: { desc: 'Anodized aluminum over-ear wireless headphones with active noise cancellation and spatial audio.', rate: 4.7, count: 83 },
            25: { desc: '2TB custom SSD console with upgraded RDNA ray-tracing GPU and 4K 120Hz HDMI 2.1 output.', rate: 4.9, count: 129 },
            26: { desc: 'DualSense wireless controller with multidimensional haptic feedback and adaptive trigger tension.', rate: 4.8, count: 142 },
          };
          if (p.id in defaultDescs) {
            p.description = defaultDescs[p.id].desc;
            p.ratingRate = defaultDescs[p.id].rate;
            p.ratingCount = defaultDescs[p.id].count;
            updated = true;
          }
        }
      }

      // Add featured catalog items with studio images if not yet present
      const extraCatalogItems: Array<{
        id: number;
        title: string;
        price: number;
        description: string;
        category: string;
        image: string;
        ratingRate: number;
        ratingCount: number;
        quantity: number;
      }> = [
        {
          id: 28,
          title: 'Corsair Vengeance 32GB DDR5-6000 RGB',
          price: 115,
          description: 'Dual-channel 32GB (2×16GB) DDR5-6000 CL30 low-latency memory kit with anodized aluminum heatspreaders.',
          category: 'memory',
          image: '/src/assets/images/product_ddr5_ram_kit_1793511150356.jpg',
          ratingRate: 4.9,
          ratingCount: 84,
          quantity: 3,
        },
        {
          id: 29,
          title: 'Alienware 34" QD-OLED Curved Monitor',
          price: 249,
          description: '3440×1440 175Hz Quantum Dot OLED curved gaming display with 0.03ms response and TrueBlack 400.',
          category: 'monitors',
          image: '/src/assets/images/product_oled_gaming_monitor_1793511152023.jpg',
          ratingRate: 4.9,
          ratingCount: 64,
          quantity: 2,
        },
        {
          id: 30,
          title: 'Noctua NH-D15 Chromax Black Cooler',
          price: 99,
          description: 'Flagship dual-tower 6-heatpipe CPU cooler with dual 140mm PWM fans in stealth matte black.',
          category: 'cooling',
          image: '/src/assets/images/product_cpu_air_cooler_1793511154222.jpg',
          ratingRate: 4.9,
          ratingCount: 112,
          quantity: 7,
        },
        {
          id: 31,
          title: 'Raspberry Pi 5 (8GB RAM)',
          price: 82,
          description: '2.4GHz quad-core 64-bit Arm Cortex-A76 single-board computer with dual 4Kp60 HDMI and PCIe 2.0.',
          category: 'microcontrollers',
          image: '/src/assets/images/product_raspberry_pi_board_1793511156464.jpg',
          ratingRate: 4.8,
          ratingCount: 95,
          quantity: 4,
        },
        {
          id: 32,
          title: 'Keychron Q1 Pro Mechanical Keyboard',
          price: 135,
          description: 'Full CNC machined aluminum gasket-mount wireless mechanical keyboard with hot-swappable tactile switches.',
          category: 'peripherals',
          image: '/images/keyboard.jpg',
          ratingRate: 4.8,
          ratingCount: 53,
          quantity: 6,
        },
        {
          id: 33,
          title: 'Elgato Facecam Pro 4K60 Webcam',
          price: 145,
          description: 'True 4K60 Ultra HD studio camera with Sony STARVIS CMOS sensor and f/2.0 all-glass prime lens.',
          category: 'peripherals',
          image: '/images/webcam.jpg',
          ratingRate: 4.7,
          ratingCount: 38,
          quantity: 3,
        },
        {
          id: 34,
          title: 'Sony WH-1000XM5 Studio ANC Headphones',
          price: 165,
          description: 'Multi-noise sensor active noise cancelling wireless headphones with 30mm carbon fiber drivers.',
          category: 'peripherals',
          image: '/images/headphones.jpg',
          ratingRate: 4.8,
          ratingCount: 77,
          quantity: 8,
        },
        {
          id: 35,
          title: 'Anker Prime 140W GaN USB-C Charger',
          price: 68,
          description: 'Compact multi-port GaNPrime 140W PD 3.1 fast power adapter with active thermal monitoring.',
          category: 'power',
          image: '/images/charger.jpg',
          ratingRate: 4.6,
          ratingCount: 41,
          quantity: 9,
        },
        {
          id: 36,
          title: 'Intel Core Ultra 9 285K Processor',
          price: 195,
          description: '24-Core (8P+16E) Arrow Lake unlocked desktop processor with integrated NPU, 5.7 GHz thermal velocity boost, and LGA1851.',
          category: 'cpus',
          image: '/src/assets/images/product_intel_ultra_cpu_1793517563101.jpg',
          ratingRate: 4.8,
          ratingCount: 74,
          quantity: 4,
        },
        {
          id: 37,
          title: 'ASUS ROG Crosshair X870E Hero Motherboard',
          price: 230,
          description: 'Flagship 18+2+2 power stage ATX motherboard with dual USB4, PCIe 5.0 x16 SafeSlots, 5× M.2 heatsinks, and Wi-Fi 7.',
          category: 'motherboards',
          image: '/src/assets/images/product_x870e_motherboard_1793517565006.jpg',
          ratingRate: 4.9,
          ratingCount: 58,
          quantity: 2,
        },
        {
          id: 38,
          title: 'Corsair MP700 Pro 4TB PCIe 5.0 NVMe SSD',
          price: 175,
          description: 'Extreme-throughput 4TB M.2 2280 Gen5 x4 NVMe SSD with CNC aluminum heatsink and up to 12,400 MB/s sequential reads.',
          category: 'storage',
          image: '/src/assets/images/product_nvme_heatsink_ssd_1793517600287.jpg',
          ratingRate: 4.9,
          ratingCount: 91,
          quantity: 5,
        },
        {
          id: 39,
          title: 'Apex Pro X1 8K Wireless Esports Mouse',
          price: 118,
          description: '53g ultra-lightweight magnesium-shell wireless esports mouse with 35,000 DPI optical sensor and 8000Hz USB-C hyperpolling dongle.',
          category: 'peripherals',
          image: '/src/assets/images/product_wireless_gaming_mouse_1793517565308.jpg',
          ratingRate: 4.8,
          ratingCount: 89,
          quantity: 7,
        },
        {
          id: 40,
          title: 'Shure SM7dB Dynamic Broadcast Microphone',
          price: 210,
          description: 'Cardioid studio broadcast XLR microphone with built-in +28dB discrete preamp, internal air-suspension shock isolation, and boom arm.',
          category: 'audio',
          image: '/src/assets/images/product_studio_broadcast_mic_1793517601003.jpg',
          ratingRate: 4.9,
          ratingCount: 108,
          quantity: 3,
        },
        {
          id: 41,
          title: 'Aethel VX-1 1TB OLED Handheld Console',
          price: 285,
          description: 'Portable PC gaming handheld with 7.4" 90Hz HDR OLED display, Hall-effect thumbsticks, 50Wh battery, and custom RDNA 3 APU.',
          category: 'gaming',
          image: '/src/assets/images/product_handheld_oled_console_1793517566556.jpg',
          ratingRate: 4.9,
          ratingCount: 134,
          quantity: 2,
        },
      ];

      for (const extra of extraCatalogItems) {
        const existing = this.products.find((prod) => prod.id === extra.id);
        if (!existing) {
          this.products.push({
            id: extra.id,
            title: extra.title,
            price: extra.price,
            description: extra.description,
            category: extra.category,
            image: extra.image,
            ratingRate: extra.ratingRate,
            ratingCount: extra.ratingCount,
            addedByName: 'Voltbox',
            addedByColor: BRAND_COLOR,
            addedByEmail: null,
            official: true,
            createdAt: Date.now(),
            takenDown: false,
            quantity: extra.quantity,
            stock: extra.quantity,
            lowStock: isLowStock({ quantity: extra.quantity }),
          });
          if (this.nextProductId <= extra.id) {
            this.nextProductId = extra.id + 1;
          }
          updated = true;
        }
      }

      // Ensure demo session token and default User (Shopper) accounts exist
      if (!this.sessions['ed4a9555-540b-4bb9-a406-b353acded905']) {
        this.sessions['ed4a9555-540b-4bb9-a406-b353acded905'] = 'harish@voltbox.test';
        updated = true;
      }
      if (!this.findByEmail('alex.chen@gmail.com')) {
        const alex = this.add('Alex Chen', 'alex.chen@gmail.com', 'Shopper123');
        alex.role = 'member';
        updated = true;
      }
      if (!this.findByEmail('maya.lin@icloud.com')) {
        const maya = this.add('Maya Lin', 'maya.lin@icloud.com', 'AppleId123');
        maya.role = 'member';
        updated = true;
      }
      if (this.messages.length === 0) {
        this.seedMessages();
        updated = true;
      }
      if (updated) {
        this.save();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`couldn't read voltbox-data.json — fix the json or delete the file to start over. (${msg})`);
    }
  }

  public save(): void {
    const data: StoreData = {
      nextId: this.nextId,
      nextProductId: this.nextProductId,
      nextApplicationId: this.nextApplicationId,
      nextReportId: this.nextReportId,
      nextMessageId: this.nextMessageId,
      users: this.users,
      sessions: this.sessions,
      products: this.products,
      applications: this.applications,
      reports: this.reports,
      messages: this.messages,
    };
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  }

  private seed(): void {
    this.users = [];
    this.sessions = {};
    this.products = [];
    this.applications = [];
    this.reports = [];
    this.messages = [];
    this.nextId = 1;
    this.nextProductId = 1;
    this.nextApplicationId = 1;
    this.nextReportId = 1;
    this.nextMessageId = 1;

    const harish = this.add('Harish', 'harish@voltbox.test', 'Harish123');
    harish.role = 'moderator';
    this.sessions['ed4a9555-540b-4bb9-a406-b353acded905'] = harish.email;

    const alex = this.add('Alex Chen', 'alex.chen@gmail.com', 'Shopper123');
    alex.role = 'member';

    const maya = this.add('Maya Lin', 'maya.lin@icloud.com', 'AppleId123');
    maya.role = 'member';

    this.seedProducts();
    this.seedMessages();
    this.save();
  }

  private seedMessages(): void {
    const now = Date.now();
    const initial: Omit<ChatMessage, 'id'>[] = [
      {
        channel: 'general',
        senderName: 'Harish',
        senderEmail: 'harish@voltbox.test',
        senderRole: 'moderator',
        senderColor: '#ffd23f',
        text: 'Welcome to Voltbox Bench Messenger! Drop part inquiries, restock pings, or share your 4-slot Rig Builder setups here.',
        productId: 19,
        productTitle: 'Nvidia RTX 5090',
        productPrice: 200,
        productSku: 'VB-GPU-019',
        productImage: 'https://www.nvidia.com/content/dam/en-zz/Solutions/geforce/graphic-cards/50-series/rtx-5090/geforce-rtx-5090-learn-more-og-1200x630.jpg',
        createdAt: now - 1000 * 60 * 18,
      },
      {
        channel: 'general',
        senderName: 'Maya Lin',
        senderEmail: 'maya@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#20c997',
        text: 'Just bench-tested the new Aethel VX-1 1TB OLED Handheld and ROG X870E Hero boards — thermal headroom is super clean.',
        productId: 41,
        productTitle: 'Aethel VX-1 1TB OLED Handheld Console',
        productPrice: 285,
        productSku: 'VB-GMG-041',
        productImage: '/src/assets/images/product_handheld_oled_console_1793517566556.jpg',
        createdAt: now - 1000 * 60 * 9,
      },
      {
        channel: 'rig-builds',
        senderName: 'Alex Rivera',
        senderEmail: 'alex@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#4dabf7',
        text: 'Pro tip: Pairing Ryzen 9 + ROG Crosshair X870E + Corsair MP700 4TB unlocks the 5% Rig Bundle automatically, and stacks with VOLT10!',
        productId: 37,
        productTitle: 'ASUS ROG Crosshair X870E Hero Motherboard',
        productPrice: 230,
        productSku: 'VB-MBD-037',
        productImage: '/src/assets/images/product_x870e_motherboard_1793517565006.jpg',
        createdAt: now - 1000 * 60 * 14,
      },
      {
        channel: 'price-drops',
        senderName: 'Harish',
        senderEmail: 'harish@voltbox.test',
        senderRole: 'moderator',
        senderColor: '#ffd23f',
        text: 'Restock Alert: 4 units of Intel Core Ultra 9 285K and 5 units of Corsair MP700 Pro 4TB Gen5 SSD just landed on the shelf.',
        productId: 36,
        productTitle: 'Intel Core Ultra 9 285K Processor',
        productPrice: 195,
        productSku: 'VB-CPU-036',
        productImage: '/src/assets/images/product_intel_ultra_cpu_1793517563101.jpg',
        createdAt: now - 1000 * 60 * 5,
      },
    ];

    for (const item of initial) {
      this.messages.push({
        ...item,
        id: this.nextMessageId++,
      });
    }
  }

  private seedProducts(): void {
    if (!fs.existsSync(SEED_PRODUCTS_FILE)) {
      console.error('voltbox: seed-products.json not found — starting with no catalog.');
      return;
    }
    const raw = fs.readFileSync(SEED_PRODUCTS_FILE, 'utf-8');
    const seeded = JSON.parse(raw) as Partial<Product>[];
    for (const item of seeded) {
      const id = this.nextProductId++;
      const qty = getProductQuantity({ id, quantity: item.quantity, stock: item.stock });
      this.products.push({
        id,
        title: item.title || '',
        price: Number(item.price) || 0,
        description: item.description || '',
        category: item.category || 'components',
        image: item.image || '',
        ratingRate: Number(item.ratingRate) || 0,
        ratingCount: Number(item.ratingCount) || 0,
        addedByName: 'Voltbox',
        addedByColor: BRAND_COLOR,
        addedByEmail: null,
        official: true,
        createdAt: 0,
        takenDown: false,
        quantity: qty,
        stock: qty,
        lowStock: isLowStock({ quantity: qty }),
      });
    }
  }

  public startSession(user: User): string {
    const token = crypto.randomUUID();
    this.sessions[token] = user.email;
    this.save();
    return token;
  }

  public findByToken(token: string | null | undefined): User | null {
    if (!token || !token.trim()) return null;
    const email = this.sessions[token.trim()];
    if (!email) return null;
    return this.findByEmail(email);
  }

  public endSession(token: string | null | undefined): void {
    if (!token) return;
    if (token in this.sessions) {
      delete this.sessions[token];
      this.save();
    }
  }

  public getUsers(): User[] {
    return this.users;
  }

  public findByEmail(email: string | null | undefined): User | null {
    if (!email) return null;
    const target = email.toLowerCase();
    for (const u of this.users) {
      if (u.email.toLowerCase() === target) {
        return u;
      }
    }
    return null;
  }

  public getUserInitial(user: User): string {
    if (!user.name || !user.name.trim()) return '?';
    return user.name.trim().substring(0, 1).toUpperCase();
  }

  public add(name: string, email: string, password: string): User {
    const user: User = {
      id: this.nextId,
      name,
      email,
      password,
      avatarColor: COLORS[(this.nextId - 1) % COLORS.length],
      billEmail: null,
      role: 'member',
      cart: {},
      orders: [],
    };
    this.nextId++;
    this.users.push(user);
    this.save();
    return user;
  }

  public getProducts(): Product[] {
    return this.products;
  }

  public findProduct(id: number): Product | null {
    for (const p of this.products) {
      if (p.id === id) return p;
    }
    return null;
  }

  public addProduct(product: Omit<Product, 'id' | 'createdAt' | 'lowStock'>): Product {
    const qty = getProductQuantity(product);
    const created: Product = {
      ...product,
      id: this.nextProductId++,
      createdAt: Date.now(),
      quantity: qty,
      stock: qty,
      lowStock: isLowStock({ quantity: qty }),
    };
    this.products.push(created);
    this.save();
    return created;
  }

  public getApplications(): Application[] {
    return this.applications;
  }

  public findApplication(id: number): Application | null {
    for (const a of this.applications) {
      if (a.id === id) return a;
    }
    return null;
  }

  public addApplication(app: Omit<Application, 'id'>): Application {
    const created: Application = {
      ...app,
      id: this.nextApplicationId++,
    };
    this.applications.push(created);
    this.save();
    return created;
  }

  public getReports(): Report[] {
    return this.reports;
  }

  public findReport(id: number): Report | null {
    for (const r of this.reports) {
      if (r.id === id) return r;
    }
    return null;
  }

  public addReport(report: Omit<Report, 'id'>): Report {
    const created: Report = {
      ...report,
      id: this.nextReportId++,
    };
    this.reports.push(created);
    this.save();
    return created;
  }

  public getMessages(channel?: string): ChatMessage[] {
    if (!channel || channel === 'all') {
      return this.messages.slice(-80);
    }
    return this.messages.filter((m) => m.channel === channel).slice(-60);
  }

  public addMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
    const created: ChatMessage = {
      ...msg,
      id: this.nextMessageId++,
      createdAt: Date.now(),
    };
    this.messages.push(created);
    if (this.messages.length > 200) {
      this.messages = this.messages.slice(-200);
    }
    this.save();
    return created;
  }
}
