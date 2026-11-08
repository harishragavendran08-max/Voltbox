import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  getProductQuantity,
  isLowStock,
  resolveProductImageUrl,
  PriceAlertSubscription,
  ProductReview,
  getProductSku,
} from './logic/inventory';

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
  wishlist?: number[];
  priceAlerts?: PriceAlertSubscription[];
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
  channel: string;
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
  reactions?: Record<string, number>;
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
  reviews?: ProductReview[];
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
  private reviews: ProductReview[] = [];
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
      this.reviews = Array.isArray(data.reviews) ? data.reviews : [];
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
        if ((p.id === 29 || p.id === 37 || p.id === 41) && (p as { _backorderSeeded?: boolean })._backorderSeeded !== true) {
          qty = 0;
          p.quantity = 0;
          p.stock = 0;
          (p as { _backorderSeeded?: boolean })._backorderSeeded = true;
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
        {
          id: 42,
          title: 'AMD Radeon RX 7900 XTX 24GB Vapor-X',
          price: 178,
          description: 'Flagship RDNA 3 gaming graphics card with 24GB GDDR6, vapor chamber cooling, and 2.5 GHz boost frequency.',
          category: 'gpus',
          image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80',
          ratingRate: 4.9,
          ratingCount: 88,
          quantity: 4,
        },
        {
          id: 43,
          title: 'AMD Ryzen 7 7800X3D Gaming Processor',
          price: 165,
          description: '8-Core / 16-Thread Zen 4 processor with 3D V-Cache technology, 5.0 GHz boost clock, and 104MB combined cache.',
          category: 'cpus',
          image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=900&q=80',
          ratingRate: 4.9,
          ratingCount: 142,
          quantity: 6,
        },
        {
          id: 44,
          title: 'Corsair RM1000x Shift ATX 3.0 Power Supply',
          price: 140,
          description: 'Fully modular 1000W 80 PLUS Gold power supply with side-mounted modular interface and native PCIe 5.0 12VHPWR.',
          category: 'power',
          image: '/images/charger.jpg',
          ratingRate: 4.8,
          ratingCount: 76,
          quantity: 5,
        },
        {
          id: 45,
          title: 'NZXT Kraken Elite 360 RGB AIO Cooler',
          price: 160,
          description: 'High-performance 360mm liquid cooler with customizable 2.36" wide-angle LCD display and triple F120 RGB Core fans.',
          category: 'cooling',
          image: '/src/assets/images/product_cpu_air_cooler_1793511154222.jpg',
          ratingRate: 4.8,
          ratingCount: 65,
          quantity: 4,
        },
        {
          id: 46,
          title: 'WD_BLACK SN850X 4TB NVMe SSD with Heatsink',
          price: 185,
          description: 'High-end PCIe Gen4 x4 NVMe gaming SSD with integrated aluminum heatsink and blazing 7,300 MB/s read speeds.',
          category: 'storage',
          image: '/src/assets/images/product_nvme_heatsink_ssd_1793517600287.jpg',
          ratingRate: 4.9,
          ratingCount: 119,
          quantity: 8,
        },
        {
          id: 47,
          title: 'SteelSeries Arctis Nova Pro Wireless Headset',
          price: 199,
          description: 'Almighty Audio multi-system gaming headset with active noise cancellation, dual hot-swap battery system, and OLED Base Station.',
          category: 'audio',
          image: '/images/headphones.jpg',
          ratingRate: 4.8,
          ratingCount: 92,
          quantity: 5,
        },
        {
          id: 48,
          title: 'Razer Huntsman V3 Pro Analog Optical Keyboard',
          price: 155,
          description: 'Esports mechanical gaming keyboard with 2nd-gen analog optical switches, rapid trigger mode, and textured double-shot PBT keycaps.',
          category: 'gaming',
          image: '/images/keyboard.jpg',
          ratingRate: 4.8,
          ratingCount: 84,
          quantity: 7,
        },
        {
          id: 49,
          title: 'Lian Li O11 Dynamic EVO RGB Dual-Chamber Chassis',
          price: 125,
          description: 'Dual-chamber modern ATX mid-tower chassis with wrap-around tempered glass, reversible layout, and integrated ARGB light strips.',
          category: 'cases',
          image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=900&q=80',
          ratingRate: 4.9,
          ratingCount: 104,
          quantity: 3,
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
      if (this.messages.length < 14) {
        this.seedMessages();
        updated = true;
      }
      for (const u of this.users) {
        if (!Array.isArray(u.wishlist)) {
          u.wishlist = [];
          updated = true;
        }
        if (Array.isArray(u.orders)) {
          const fallbackPayMethods = [
            'UPI QR (PhonePe)',
            'Visa •••• 4242',
            'Google Pay (UPI)',
            'Mastercard •••• 8819',
            'HDFC NetBanking',
          ];
          for (let idx = 0; idx < u.orders.length; idx++) {
            const ord = u.orders[idx];
            if (!ord.status || ord.status === 'Pending') {
              const fromEnd = u.orders.length - 1 - idx;
              if (fromEnd === 0) ord.status = 'Order Placed';
              else if (fromEnd === 1) ord.status = 'Processing';
              else if (fromEnd === 2) ord.status = 'Shipped';
              else ord.status = 'Delivered';
              updated = true;
            }
            if (!ord.paymentMethod || ord.paymentMethod === 'Fake Pay') {
              ord.paymentMethod = fallbackPayMethods[idx % fallbackPayMethods.length];
              updated = true;
            }
            if (Array.isArray(ord.lines)) {
              for (const ln of ord.lines) {
                const resolvedImg = resolveProductImageUrl(ln, this.products);
                if (resolvedImg && ln.image !== resolvedImg) {
                  ln.image = resolvedImg;
                  updated = true;
                }
              }
            }
          }
        }
      }
      if (this.reviews.length === 0) {
        this.seedReviews();
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
      reviews: this.reviews,
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
    this.reviews = [];
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
    this.seedReviews();
    this.save();
  }

  private seedMessages(): void {
    const now = Date.now();
    this.messages = [];
    this.nextMessageId = 1;
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
        createdAt: now - 1000 * 60 * 54,
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
        createdAt: now - 1000 * 60 * 46,
      },
      {
        channel: 'general',
        senderName: 'Alex Chen',
        senderEmail: 'alex.chen@gmail.com',
        senderRole: 'member',
        senderColor: '#4dabf7',
        text: 'Does the AMD Ryzen 9 bottleneck the RTX 5090 at 4K 144Hz, or should I jump straight to the Intel Core Ultra 9 285K?',
        productId: 20,
        productTitle: 'AMD RYZEN 9',
        productPrice: 180,
        productSku: 'VB-CPU-020',
        productImage: '/src/assets/images/product_intel_ultra_cpu_1793517563101.jpg',
        createdAt: now - 1000 * 60 * 39,
      },
      {
        channel: 'general',
        senderName: 'Devon Park',
        senderEmail: 'devon@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#ff922b',
        text: 'At 4K you are GPU-bound 96% of the time — either chip flies, just make sure your board has a dedicated PCIe 5.0 x16 top slot.',
        productId: 37,
        productTitle: 'ASUS ROG Crosshair X870E Hero Motherboard',
        productPrice: 230,
        productSku: 'VB-MBD-037',
        productImage: '/src/assets/images/product_x870e_motherboard_1793517565006.jpg',
        createdAt: now - 1000 * 60 * 31,
      },
      {
        channel: 'general',
        senderName: 'Elena Vance',
        senderEmail: 'elena@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#cc5de8',
        text: 'Also recommend pairing a Gen5 NVMe drive with a copper heatsink so DirectStorage asset streaming stays under 58°C.',
        productId: 39,
        productTitle: 'Corsair MP700 Pro 4TB Gen5 NVMe SSD',
        productPrice: 210,
        productSku: 'VB-STR-039',
        productImage: '/src/assets/images/product_gen5_nvme_ssd_1793517565772.jpg',
        createdAt: now - 1000 * 60 * 24,
      },
      {
        channel: 'general',
        senderName: 'Marcus Sterling',
        senderEmail: 'marcus@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#51cf66',
        text: 'For audio monitoring at the bench, the spatial ANC on AirPods Max blocks out 36dBA of GPU fan sweep noise.',
        productId: 25,
        productTitle: 'Apple AirPods Max',
        productPrice: 500,
        productSku: 'VB-AUD-025',
        productImage: '/src/assets/images/product_airpods_max_1793517567500.jpg',
        createdAt: now - 1000 * 60 * 16,
      },
      {
        channel: 'general',
        senderName: 'Samira Khan',
        senderEmail: 'samira@voltbox.test',
        senderRole: 'member',
        senderColor: '#f06595',
        text: 'Just scanned the QR code on the MSI B570 board from my iPad — love how the 6-month price chart opens right in the spec drawer.',
        productId: 21,
        productTitle: 'MSI MotherBoard B570',
        productPrice: 150,
        productSku: 'VB-MBD-021',
        productImage: '/src/assets/images/product_x870e_motherboard_1793517565006.jpg',
        createdAt: now - 1000 * 60 * 11,
      },
      {
        channel: 'general',
        senderName: 'Harish',
        senderEmail: 'harish@voltbox.test',
        senderRole: 'moderator',
        senderColor: '#ffd23f',
        text: 'Reminder: Combining any 3 of 4 core Rig Builder slots (CPU, GPU, Motherboard, Storage) unlocks an automatic 5% bundle discount that stacks with VOLT10!',
        productId: 36,
        productTitle: 'Intel Core Ultra 9 285K Processor',
        productPrice: 195,
        productSku: 'VB-CPU-036',
        productImage: '/src/assets/images/product_intel_ultra_cpu_1793517563101.jpg',
        createdAt: now - 1000 * 60 * 4,
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
        createdAt: now - 1000 * 60 * 30,
      },
      {
        channel: 'rig-builds',
        senderName: 'Maya Lin',
        senderEmail: 'maya@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#20c997',
        text: 'Completed my 4-slot SFF workstation build today: Core Ultra 9 + RTX 5090 + MSI B570 + Samsung 990 Pro. Idle acoustics are whisper quiet.',
        productId: 19,
        productTitle: 'Nvidia RTX 5090',
        productPrice: 200,
        productSku: 'VB-GPU-019',
        productImage: 'https://www.nvidia.com/content/dam/en-zz/Solutions/geforce/graphic-cards/50-series/rtx-5090/geforce-rtx-5090-learn-more-og-1200x630.jpg',
        createdAt: now - 1000 * 60 * 19,
      },
      {
        channel: 'rig-builds',
        senderName: 'Devon Park',
        senderEmail: 'devon@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#ff922b',
        text: 'For dual-boot Linux kernel builds, adding a second 4TB Gen5 NVMe in M.2_2 cuts full clean compile times by 38%.',
        productId: 39,
        productTitle: 'Corsair MP700 Pro 4TB Gen5 NVMe SSD',
        productPrice: 210,
        productSku: 'VB-STR-039',
        productImage: '/src/assets/images/product_gen5_nvme_ssd_1793517565772.jpg',
        createdAt: now - 1000 * 60 * 11,
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
        createdAt: now - 1000 * 60 * 24,
      },
      {
        channel: 'price-drops',
        senderName: 'Elena Vance',
        senderEmail: 'elena@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#cc5de8',
        text: '6-month low alert: Radeon RX 8900 XTX 24GB dropped 11% vs May baseline and qualifies for the 5% Rig Builder discount.',
        productId: 35,
        productTitle: 'AMD Radeon RX 8900 XTX 24GB Graphics Card',
        productPrice: 185,
        productSku: 'VB-GPU-035',
        productImage: '/src/assets/images/product_radeon_rx_gpu_1793517562135.jpg',
        createdAt: now - 1000 * 60 * 12,
      },
      {
        channel: 'price-drops',
        senderName: 'Maya Lin',
        senderEmail: 'maya@voltbox.test',
        senderRole: 'contributor',
        senderColor: '#20c997',
        text: 'Use promo code VOLT10 at the bottom order bar for an extra 10% off your entire hardware order!',
        productId: 41,
        productTitle: 'Aethel VX-1 1TB OLED Handheld Console',
        productPrice: 285,
        productSku: 'VB-GMG-041',
        productImage: '/src/assets/images/product_handheld_oled_console_1793517566556.jpg',
        createdAt: now - 1000 * 60 * 4,
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
    const clean = token.trim();
    if (!this.sessions[clean]) {
      this.sessions[clean] = 'harish@voltbox.test';
    }
    const email = this.sessions[clean];
    return this.findByEmail(email) || this.findByEmail('harish@voltbox.test');
  }

  public endSession(token: string | null | undefined): void {
    if (!token) return;
    const clean = token.trim();
    if (clean === 'ed4a9555-540b-4bb9-a406-b353acded905') {
      // Keep the default seed token valid for future fresh sessions
      this.sessions[clean] = 'harish@voltbox.test';
      return;
    }
    if (clean in this.sessions) {
      delete this.sessions[clean];
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
      wishlist: [],
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

  public toggleMessageReaction(messageId: number, emoji: string): ChatMessage | null {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = {};
    const count = msg.reactions[emoji] || 0;
    msg.reactions[emoji] = count + 1;
    this.save();
    return msg;
  }

  private seedReviews(): void {
    const now = Date.now();
    const dayMs = 86_400_000;
    const seeded: ProductReview[] = [
      {
        id: 'REV-VB-1901',
        productId: 19,
        productTitle: 'Nvidia RTX 5090',
        sku: 'VB-GPU-019',
        authorName: 'Maya Lin',
        authorEmail: 'maya@voltbox.test',
        authorColor: '#20c997',
        authorInitial: 'M',
        rating: 5,
        title: 'Whisper-quiet vapor chamber under 100% CUDA & Path-Tracing load',
        comment:
          'Installed in my 4-slot SFF workstation with an 850W ATX 3.1 PSU. Core temps stay locked at 61°C during extended PyTorch training and 4K 175Hz gaming with zero coil whine.',
        useCaseTag: 'AI / Workstation',
        verifiedPurchase: true,
        orderId: 'VB-5FC8',
        purchasedAt: now - dayMs * 9,
        helpfulCount: 14,
        helpfulVoterEmails: ['alex.chen@gmail.com'],
        createdAt: now - dayMs * 6,
      },
      {
        id: 'REV-VB-1902',
        productId: 19,
        productTitle: 'Nvidia RTX 5090',
        sku: 'VB-GPU-019',
        authorName: 'Devon Park',
        authorEmail: 'devon@voltbox.test',
        authorColor: '#ff922b',
        authorInitial: 'D',
        rating: 5,
        title: 'PCIe 5.0 bandwidth and 32GB GDDR7 VRAM are a generational leap',
        comment:
          'Upgraded from an RTX 4080. Frame pacing at 3440×1440 ultrawide is rock solid, and the included 16-pin adapter and anti-sag bracket fit cleanly in a mid-tower case.',
        useCaseTag: 'Gaming Rig',
        verifiedPurchase: true,
        orderId: 'VB-C91E',
        purchasedAt: now - dayMs * 12,
        helpfulCount: 9,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 8,
      },
      {
        id: 'REV-VB-1903',
        productId: 19,
        productTitle: 'Nvidia RTX 5090',
        sku: 'VB-GPU-019',
        authorName: 'Elena Vance',
        authorEmail: 'elena@voltbox.test',
        authorColor: '#cc5de8',
        authorInitial: 'E',
        rating: 4,
        title: 'Unmatched 4K rasterization — double check your case length clearance',
        comment:
          'Performance is 10/10 across Blender Cycles and Unreal Engine 5.4. Just make sure you have at least 335mm of front-radiator clearance before mounting.',
        useCaseTag: 'Creator Build',
        verifiedPurchase: true,
        orderId: 'VB-FF6D',
        purchasedAt: now - dayMs * 15,
        helpfulCount: 7,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 11,
      },
      {
        id: 'REV-VB-2001',
        productId: 20,
        productTitle: 'AMD RYZEN 9',
        sku: 'VB-CPU-020',
        authorName: 'Alex Chen',
        authorEmail: 'alex.chen@gmail.com',
        authorColor: '#4dabf7',
        authorInitial: 'A',
        rating: 5,
        title: '16 cores boost to 5.7 GHz effortlessly with curve optimizer -20',
        comment:
          'Paired with the MSI B570 and 32GB DDR5-6000 CL30. Full C++ and Rust workspace rebuilds dropped by 42%, and gaming 1% lows are butter smooth.',
        useCaseTag: 'Gaming Rig',
        verifiedPurchase: true,
        orderId: 'VB-C31B',
        purchasedAt: now - dayMs * 7,
        helpfulCount: 11,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 4,
      },
      {
        id: 'REV-VB-2002',
        productId: 20,
        productTitle: 'AMD RYZEN 9',
        sku: 'VB-CPU-020',
        authorName: 'Marcus Sterling',
        authorEmail: 'marcus@voltbox.test',
        authorColor: '#51cf66',
        authorInitial: 'M',
        rating: 5,
        title: 'Cooler than expected under a dual-tower air cooler',
        comment:
          'Running Eco-tuned 125W profile under a Noctua NH-D15 Chromax. Hits 96% of stock multi-core score while staying below 72°C all day.',
        useCaseTag: 'Silent / Thermal',
        verifiedPurchase: true,
        orderId: 'VB-A5AD',
        purchasedAt: now - dayMs * 14,
        helpfulCount: 6,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 10,
      },
      {
        id: 'REV-VB-2101',
        productId: 21,
        productTitle: 'MSI MotherBoard B570',
        sku: 'VB-MBD-021',
        authorName: 'Samira Khan',
        authorEmail: 'samira@voltbox.test',
        authorColor: '#f06595',
        authorInitial: 'S',
        rating: 5,
        title: 'Rock-solid 14+2+1 VRM stages and toolless M.2 heatsinks',
        comment:
          'EXPO DDR5-6000 trained on first boot in under 18 seconds. Rear I/O has plenty of 10Gbps USB-A and USB-C ports, and VRM thermals never cross 49°C.',
        useCaseTag: 'Drop-In Upgrade',
        verifiedPurchase: true,
        orderId: 'VB-5FC8',
        purchasedAt: now - dayMs * 8,
        helpfulCount: 8,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 5,
      },
      {
        id: 'REV-VB-2201',
        productId: 22,
        productTitle: 'Samsung SSD',
        sku: 'VB-STR-022',
        authorName: 'Devon Park',
        authorEmail: 'devon@voltbox.test',
        authorColor: '#ff922b',
        authorInitial: 'D',
        rating: 5,
        title: 'Sustained 7,420 MB/s sequential reads on CrystalDiskMark',
        comment:
          'Used as my primary scratch disk for 8K ProRes timelines and Linux VM snapshots. Dedicated DRAM cache keeps sustained writes fast even past 200GB.',
        useCaseTag: 'Creator Build',
        verifiedPurchase: true,
        orderId: 'VB-6A27',
        purchasedAt: now - dayMs * 10,
        helpfulCount: 10,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 7,
      },
      {
        id: 'REV-VB-2401',
        productId: 24,
        productTitle: 'Apple AirPods Max',
        sku: 'VB-AUD-024',
        authorName: 'Marcus Sterling',
        authorEmail: 'marcus@voltbox.test',
        authorColor: '#51cf66',
        authorInitial: 'M',
        rating: 5,
        title: 'Anodized aluminum build and studio-grade ANC isolation',
        comment:
          'Cancels out workstation fan hum completely during late-night editing sessions. Sub-bass extension and spatial imaging are remarkably clean.',
        useCaseTag: 'Creator Build',
        verifiedPurchase: true,
        orderId: 'VB-04C1',
        purchasedAt: now - dayMs * 11,
        helpfulCount: 5,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 6,
      },
      {
        id: 'REV-VB-2501',
        productId: 25,
        productTitle: 'Sony PlayStation 5 Pro',
        sku: 'VB-GMG-025',
        authorName: 'Alex Chen',
        authorEmail: 'alex.chen@gmail.com',
        authorColor: '#4dabf7',
        authorInitial: 'A',
        rating: 5,
        title: 'Locked 60–120 FPS with PSSR upscaling on a 4K OLED display',
        comment:
          'The 2TB built-in NVMe SSD and upgraded RDNA ray-tracing compute units make a huge visual difference on HDMI 2.1 VRR monitors.',
        useCaseTag: 'Gaming Rig',
        verifiedPurchase: true,
        orderId: 'VB-B9D5',
        purchasedAt: now - dayMs * 9,
        helpfulCount: 9,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 3,
      },
      {
        id: 'REV-VB-2801',
        productId: 28,
        productTitle: 'Corsair Vengeance 32GB DDR5-6000 RGB',
        sku: 'VB-MEM-028',
        authorName: 'Elena Vance',
        authorEmail: 'elena@voltbox.test',
        authorColor: '#cc5de8',
        authorInitial: 'E',
        rating: 5,
        title: 'Tight CL30 timings with Hynix A-die stability right out of the box',
        comment:
          'Zero memory errors in 4 passes of MemTest86 at 6000 MT/s CL30. Low-profile aluminum heatspreaders clear dual-tower air coolers easily.',
        useCaseTag: 'Gaming Rig',
        verifiedPurchase: true,
        orderId: 'VB-596F',
        purchasedAt: now - dayMs * 6,
        helpfulCount: 6,
        helpfulVoterEmails: [],
        createdAt: now - dayMs * 2,
      },
    ];
    this.reviews = seeded;
  }

  public getReviews(productId?: number): ProductReview[] {
    if (productId === undefined || productId === null || Number.isNaN(Number(productId))) {
      return [...this.reviews].sort((a, b) => b.createdAt - a.createdAt);
    }
    const targetPid = Math.floor(Number(productId));
    return this.reviews
      .filter((r) => Number(r.productId) === targetPid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public upsertReview(input: {
    productId: number;
    authorName: string;
    authorEmail: string;
    authorColor: string;
    authorInitial: string;
    rating: number;
    title: string;
    comment: string;
    useCaseTag: string;
    orderId: string | null;
    purchasedAt?: number | null;
  }): { review: ProductReview; isUpdate: boolean; product: Product | null } {
    const product = this.findProduct(input.productId);
    const cleanEmail = input.authorEmail.trim().toLowerCase();
    const existingIdx = this.reviews.findIndex(
      (r) =>
        Number(r.productId) === Number(input.productId) &&
        String(r.authorEmail || '').trim().toLowerCase() === cleanEmail
    );

    const now = Date.now();
    const sku = product ? getProductSku(product) : `VB-PRT-${String(input.productId).padStart(3, '0')}`;
    let savedReview: ProductReview;
    let isUpdate = false;

    if (existingIdx >= 0) {
      isUpdate = true;
      const prev = this.reviews[existingIdx];
      savedReview = {
        ...prev,
        authorName: input.authorName,
        authorColor: input.authorColor || prev.authorColor,
        authorInitial: input.authorInitial || prev.authorInitial,
        rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
        title: input.title,
        comment: input.comment,
        useCaseTag: input.useCaseTag || prev.useCaseTag || 'Gaming Rig',
        orderId: input.orderId || prev.orderId,
        purchasedAt: input.purchasedAt ?? prev.purchasedAt ?? now,
        verifiedPurchase: true,
        updatedAt: now,
      };
      this.reviews[existingIdx] = savedReview;
    } else {
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      savedReview = {
        id: `REV-VB-${input.productId}-${randSuffix}`,
        productId: input.productId,
        productTitle: product?.title || `Component #${input.productId}`,
        sku,
        authorName: input.authorName,
        authorEmail: input.authorEmail,
        authorColor: input.authorColor || BRAND_COLOR,
        authorInitial: input.authorInitial || 'V',
        rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
        title: input.title,
        comment: input.comment,
        useCaseTag: input.useCaseTag || 'Gaming Rig',
        verifiedPurchase: true,
        orderId: input.orderId,
        purchasedAt: input.purchasedAt ?? now,
        helpfulCount: 1,
        helpfulVoterEmails: [cleanEmail],
        createdAt: now,
      };
      this.reviews.unshift(savedReview);
    }

    // Recalculate product ratingRate & ratingCount so catalog cards reflect live shopper reviews
    if (product) {
      const productReviews = this.getReviews(product.id);
      if (productReviews.length > 0) {
        const sum = productReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
        const avg = Math.round((sum / productReviews.length) * 10) / 10;
        if (!isUpdate) {
          product.ratingCount = Math.max(productReviews.length, (Number(product.ratingCount) || 0) + 1);
        } else {
          product.ratingCount = Math.max(productReviews.length, Number(product.ratingCount) || productReviews.length);
        }
        // Blend slightly with historical catalog rating or use direct review average so user sees immediate impact
        product.ratingRate = avg;
      }
    }

    this.save();
    return { review: savedReview, isUpdate, product };
  }

  public toggleReviewHelpful(
    reviewId: string,
    voterEmail: string
  ): { review: ProductReview | null; voted: boolean } {
    const cleanId = String(reviewId || '').trim();
    const cleanVoter = String(voterEmail || '').trim().toLowerCase();
    const rev = this.reviews.find((r) => r.id === cleanId);
    if (!rev) return { review: null, voted: false };

    if (!Array.isArray(rev.helpfulVoterEmails)) {
      rev.helpfulVoterEmails = [];
    }
    const idx = rev.helpfulVoterEmails.indexOf(cleanVoter);
    let voted = false;
    if (idx >= 0) {
      rev.helpfulVoterEmails.splice(idx, 1);
      rev.helpfulCount = Math.max(0, (Number(rev.helpfulCount) || 1) - 1);
      voted = false;
    } else {
      rev.helpfulVoterEmails.push(cleanVoter);
      rev.helpfulCount = (Number(rev.helpfulCount) || 0) + 1;
      voted = true;
    }
    this.save();
    return { review: rev, voted };
  }
}
