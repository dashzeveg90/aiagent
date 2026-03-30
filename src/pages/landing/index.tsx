import { Button, Tag, Collapse, ConfigProvider } from "antd";
import {
  CheckOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  TeamOutlined,
  BarChartOutlined,
  BgColorsOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Panel } = Collapse;

const plans = [
  {
    name: "Starter",
    price: "$49",
    desc: "Жижиг бизнест",
    features: [
      "1 суваг (вэб эсвэл FB)",
      "500 мессеж/сар",
      "50 баримт хүртэл",
      "Email дэмжлэг",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "$149",
    desc: "Дунд бизнест",
    features: [
      "3 суваг",
      "5,000 мессеж/сар",
      "Хязгааргүй баримт",
      "Human handover",
      "Analytics",
      "White-label",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$399",
    desc: "Том байгууллагад",
    features: [
      "Бүх суваг",
      "Хязгааргүй мессеж",
      "Custom domain",
      "SLA баталгаа",
      "Тусгай дэмжлэг",
      "API хандалт",
    ],
    popular: false,
  },
];

const features = [
  {
    icon: <ThunderboltOutlined />,
    title: "RAG технологи",
    desc: "Chatbot зөвхөн таны баримт бичигт тулгуурлан хариулна. Буруу мэдээлэл өгөхгүй.",
  },
  {
    icon: <MessageOutlined />,
    title: "Олон суваг",
    desc: "Вэбсайт болон Facebook Messenger дээр нэгэн зэрэг ажиллана.",
  },
  {
    icon: <TeamOutlined />,
    title: "Human handover",
    desc: "Хэрэглэгч хүсвэл шууд ажилтанд шилжинэ. Facebook Inbox-оос хариулна.",
  },
  {
    icon: <BgColorsOutlined />,
    title: "White-label",
    desc: "Таны брэндийн өнгө, лого, нэртэй chatbot.",
  },
  {
    icon: <BarChartOutlined />,
    title: "Analytics",
    desc: "Мессеж, хариулаагүй асуулт, идэвхтэй цагийг бодит цагт харна.",
  },
  {
    icon: <RocketOutlined />,
    title: "5 минутад бэлэн",
    desc: "Бүртгүүлж, баримтаа оруулаад chatbot ажиллана. Кодчилол шаардахгүй.",
  },
];

const faqs = [
  {
    q: "Кодчилол мэдэхгүй байсан ч болох уу?",
    a: "Тийм! Dashboard дотор баримт оруулаад тохиргоо хийгээд болно. Вэбсайтад нэг мөр script оруулна.",
  },
  {
    q: "Ямар файл форматыг дэмждэг вэ?",
    a: ".docx болон .pdf форматуудыг дэмждэг. Файл бүр автоматаар боловсрогдоно.",
  },
  {
    q: "Chatbot буруу хариулвал яах вэ?",
    a: '"Ажилтантай холбогдох" гэвэл шууд Facebook Page Inbox руу шилжинэ.',
  },
  {
    q: "Цуцлах хялбар уу?",
    a: "Тийм. Dashboard дотроос хэдийд ч цуцлах боломжтой. Нэмэлт төлбөр гарахгүй.",
  },
];

const ChatPreview: React.FC = () => (
  <div className="w-72 flex-shrink-0 rounded-2xl border border-blue-200 overflow-hidden shadow-md">
    <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
        <MessageOutlined style={{ color: "white", fontSize: 16 }} />
      </div>
      <div>
        <p className="text-white text-sm font-semibold">Компанийн туслах</p>
        <p className="text-blue-200 text-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Онлайн
        </p>
      </div>
    </div>
    <div className="bg-blue-50/40 p-4 flex flex-col gap-2.5 min-h-44">
      {[
        { role: "bot", text: "Сайн байна уу! Юугаар туслах вэ?" },
        { role: "user", text: "Ажлын цаг хэд вэ?" },
        { role: "bot", text: "Даваа–Баасан 9:00–18:00 байна." },
      ].map((m, i) => (
        <div
          key={i}
          className={`text-xs px-3 py-2 rounded-xl max-w-[80%] leading-relaxed ${
            m.role === "user"
              ? "bg-blue-600 text-white self-end rounded-br-sm"
              : "bg-white border border-blue-100 text-blue-900 rounded-bl-sm"
          }`}
        >
          {m.text}
        </div>
      ))}
    </div>
    <div className="p-3 border-t border-blue-100 bg-white flex gap-2 items-center">
      <div className="flex-1 bg-blue-50 border border-blue-100 rounded-full px-3 py-2 text-xs text-gray-400">
        Асуултаа бичнэ үү...
      </div>
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const router = useRouter();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2563eb",
          borderRadius: 12,
          fontFamily: "inherit",
        },
      }}
    >
      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white border-b border-blue-100">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <span className="text-xl font-bold text-blue-900">BotFlow</span>
            <div className="hidden md:flex gap-8 text-sm text-gray-500">
              {["Онцлог", "Хэрхэн ажилладаг", "Үнэ", "FAQ"].map((label, i) => (
                <a
                  key={i}
                  href={`#${["features", "how", "pricing", "faq"][i]}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/auth")}>Нэвтрэх</Button>
              <Button type="primary" onClick={() => router.push("/auth")}>
                Үнэгүй эхлэх
              </Button>
            </div>
          </div>
        </nav>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <Tag color="blue" className="mb-5 text-xs px-3 py-1">
              AI · RAG · Multi-channel
            </Tag>
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 leading-tight mb-5">
              Таны бизнест
              <br />
              <span className="text-blue-500">ухаалаг chatbot</span>
              <br />5 минутад
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
              Баримт бичгээ оруулаад вэбсайт болон Facebook Messenger дээрээ
              мэдлэгт суурилсан chatbot ажиллуулаарай. Кодчилол шаардахгүй.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button
                type="primary"
                size="large"
                onClick={() => router.push("/auth")}
              >
                Үнэгүй 14 хоног туршиж үзэх
              </Button>
              <Button size="large" href="#how">
                Хэрхэн ажилладаг
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Картын мэдээлэл шаардахгүй · Хэдхэн минутад бэлэн
            </p>
          </div>
          <ChatPreview />
        </section>

        {/* Stats */}
        <section className="bg-blue-600">
          <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: "500+", label: "Харилцагч" },
              { num: "98%", label: "Хариулт зөв" },
              { num: "5 мин", label: "Тохируулах" },
              { num: "24/7", label: "Ажиллах цаг" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-white">{s.num}</p>
                <p className="text-blue-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-3">
              Яагаад BotFlow?
            </h2>
            <p className="text-gray-500">
              Бусад chatbot-оос ялгарах гол онцлогууд
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="text-blue-600 text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-blue-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-blue-50 py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-900 mb-3">
                Хэрхэн ажилладаг вэ?
              </h2>
              <p className="text-gray-500">3 алхамд chatbot ажиллуулна</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Бүртгүүлнэ",
                  desc: "И-мэйлээр бүртгүүлж, компанийхаа мэдээллийг оруулна.",
                },
                {
                  step: "02",
                  title: "Баримт оруулна",
                  desc: ".docx, .pdf файлуудаа оруулна. Chatbot тэр дороо сурна.",
                },
                {
                  step: "03",
                  title: "Chatbot ажиллана",
                  desc: "Вэбсайтдаа widget суулгах эсвэл FB Messenger холбоно.",
                },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-3">
              Үнийн бодлого
            </h2>
            <p className="text-gray-500">
              14 хоногийн үнэгүй туршилт · Картын мэдээлэл шаардахгүй
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.popular
                    ? "bg-blue-600 border-2 border-blue-600"
                    : "bg-white border border-blue-100"
                }`}
              >
                {plan.popular && (
                  <Tag
                    color="white"
                    className="self-start mb-4 text-blue-600 font-semibold"
                  >
                    Хамгийн их сонгогддог
                  </Tag>
                )}
                <h3
                  className={`font-bold text-xl mb-1 ${plan.popular ? "text-white" : "text-blue-900"}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-4 ${plan.popular ? "text-blue-200" : "text-gray-400"}`}
                >
                  {plan.desc}
                </p>
                <div className="mb-6">
                  <span
                    className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-blue-900"}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${plan.popular ? "text-blue-200" : "text-gray-400"}`}
                  >
                    /сар
                  </span>
                </div>
                <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      className={`text-sm flex items-center gap-2 ${
                        plan.popular ? "text-blue-100" : "text-gray-600"
                      }`}
                    >
                      <CheckOutlined
                        style={{
                          color: plan.popular ? "#93c5fd" : "#2563eb",
                          fontSize: 13,
                        }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  type={plan.popular ? "default" : "primary"}
                  size="large"
                  block
                  onClick={() => router.push("/auth")}
                  className={plan.popular ? "font-semibold" : ""}
                >
                  Үнэгүй эхлэх
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-blue-50 py-20">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-blue-900 text-center mb-12">
              Түгээмэл асуултууд
            </h2>
            <Collapse
              bordered={false}
              className="bg-transparent"
              items={faqs.map((item, i) => ({
                key: i,
                label: (
                  <span className="font-medium text-blue-900">{item.q}</span>
                ),
                children: (
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.a}
                  </p>
                ),
                style: {
                  marginBottom: 12,
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid #bfdbfe",
                },
              }))}
            />
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 py-20">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Өнөөдөр эхлэх үү?
            </h2>
            <p className="text-blue-200 mb-8 leading-relaxed">
              14 хоногийн үнэгүй туршилт. Картын мэдээлэл шаардахгүй.
            </p>
            <Button
              size="large"
              onClick={() => router.push("/auth")}
              className="bg-white text-blue-600 border-white font-semibold hover:bg-blue-50"
            >
              Үнэгүй бүртгүүлэх
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 py-8">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-blue-900 font-bold text-lg">BotFlow</span>
            <p className="text-gray-400 text-sm">
              © 2026 BotFlow. Бүх эрх хуулиар хамгаалагдсан.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              {["Нууцлал", "Нөхцөл", "Холбоо барих"].map((label, i) => (
                <a
                  key={i}
                  href="#"
                  className="hover:text-gray-600 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </ConfigProvider>
  );
}
