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

export interface StoreData {
  nextId: number;
  nextProductId: number;
  nextApplicationId: number;
  nextReportId: number;
  users: User[];
  sessions: Record<string, string>;
  products: Product[];
  applications: Application[];
  reports: Report[];
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
      this.nextId = Math.max(data.nextId || 1, 1);
      this.nextProductId = Math.max(data.nextProductId || 1, 1);
      this.nextApplicationId = Math.max(data.nextApplicationId || 1, 1);
      this.nextReportId = Math.max(data.nextReportId || 1, 1);

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

      // Ensure demo session token exists for seamless preview access
      if (!this.sessions['ed4a9555-540b-4bb9-a406-b353acded905']) {
        this.sessions['ed4a9555-540b-4bb9-a406-b353acded905'] = 'harish@voltbox.test';
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
      users: this.users,
      sessions: this.sessions,
      products: this.products,
      applications: this.applications,
      reports: this.reports,
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
    this.nextId = 1;
    this.nextProductId = 1;
    this.nextApplicationId = 1;
    this.nextReportId = 1;

    const harish = this.add('Harish', 'harish@voltbox.test', 'Harish123');
    harish.role = 'moderator';
    this.sessions['ed4a9555-540b-4bb9-a406-b353acded905'] = harish.email;
    this.seedProducts();
    this.save();
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
}
