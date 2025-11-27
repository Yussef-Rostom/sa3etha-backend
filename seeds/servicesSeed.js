require("dotenv").config(); // Added to load environment variables
const mongoose = require("mongoose");
const Service = require("../models/Service"); // Adjust path if needed
const SubService = require("../models/SubService"); // Adjust path if needed

// Using environment variables for the connection string
const DB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vzoxgr2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// The data from your services.json file
const servicesData = [
  {
    name: "صيانة المنزل",
    icon: "https://res.cloudinary.com/dpmsou908/image/upload/v1762123935/sa3tha%20services%20images/1762123929580-Picsart_25-11-03_00-50-54-652.png.png",
    description:
      "خدمات للحفاظ على منزلك في أفضل حالة، من الأنابيب إلى الأسلاك.",
    subservices: [
      {
        name: "السباكة",
        description: "إصلاح التسريبات وفتح المصارف وتركيب الأنابيب.",
      },
      {
        name: "الأعمال الكهربائية",
        description: "تركيب التجهيزات وإصلاح الأسلاك وضمان السلامة.",
      },
      {
        name: "النجارة",
        description:
          "بناء وإصلاح وتركيب التجهيزات والأثاث الخشبي.",
      },
      {
        name: "الدهان",
        description:
          "خدمات الدهان الداخلي والخارجي لمظهر جديد.",
      },
      {
        name: "تركيب البلاط",
        description: "تركيب وإصلاح بلاط الأرضيات والجدران.",
      },
      {
        name: "صانع الأقفال",
        description: "تركيب وإصلاح وفتح الأقفال.",
      },
    ],
  },
  {
    name: "إصلاح الأجهزة",
    icon: "https://res.cloudinary.com/dpmsou908/image/upload/v1762123048/sa3tha%20services%20images/1762123043594-Picsart_25-11-02_22-44-28-938.png.png",
    description: "إصلاح أجهزتك المنزلية الأساسية بواسطة محترفين.",
    subservices: [
      {
        name: "إصلاح المكيفات",
        description: "صيانة وإصلاح جميع أنواع المكيفات.",
      },
      {
        name: "إصلاح الثلاجات",
        description:
          "إصلاح مشاكل التبريد والتسريبات وأجزاء الثلاجة المعطلة.",
      },
      {
        name: "إصلاح الغسالات",
        description: "إصلاح الغسالات التي لا تدور أو تصرف أو تعمل.",
      },
      {
        name: "إصلاح التلفزيونات",
        description:
          "إصلاح مشاكل الشاشة ومشاكل الصوت وأعطال الطاقة.",
      },
      {
        name: "إصلاح الميكروويف",
        description: "إصلاح أجهزة الميكروويف التي لا تسخن أو تعمل.",
      },
    ],
  },
  {
    name: "خدمات التنظيف",
    icon: "https://res.cloudinary.com/dpmsou908/image/upload/v1762124089/sa3tha%20services%20images/1762124081759-Picsart_25-11-02_22-39-44-198.png.png",
    description: "تنظيف احترافي للمنازل والمكاتب والمزيد.",
    subservices: [
      {
        name: "تنظيف المنازل",
        description:
          "تنظيف عام لمنزلك، بما في ذلك إزالة الغبار والمسح.",
      },
      {
        name: "التنظيف العميق",
        description:
          "خدمة تنظيف شاملة من الأعلى إلى الأسفل لجميع الغرف.",
      },
      {
        name: "تنظيف المكاتب",
        description:
          "الحفاظ على مساحة عملك نظيفة وصحية ومهنية.",
      },
      {
        name: "تنظيف السجاد",
        description: "تنظيف عميق وإزالة البقع من السجاد والبُسط.",
      },
      {
        name: "تنظيف النوافذ",
        description: "تنظيف خالٍ من الخطوط للنوافذ الداخلية والخارجية.",
      },
    ],
  },
  {
    name: "البناء",
    icon: "https://res.cloudinary.com/dpmsou908/image/upload/v1762124154/sa3tha%20services%20images/1762124148474-Picsart_25-11-02_22-48-23-489.png.png",
    description:
      "البناء والتجديد والأعمال الإنشائية من الأساس.",
    subservices: [
      {
        name: "البناء العام",
        description: "إدارة وتنفيذ جميع مراحل مشروع البناء.",
      },
      {
        name: "التجديد",
        description: "تحديث وإعادة تصميم الهياكل القائمة.",
      },
      {
        name: "المحارة",
        description:
          "تطبيق الجبس على الجدران والأسقف للحصول على تشطيب ناعم.",
      },
      {
        name: "البناء بالطوب",
        description: "العمل بالطوب والحجر والخرسانة للهياكل.",
      },
      {
        name: "أعمال الأسقف",
        description: "تركيب وإصلاح وصيانة الأسقف.",
      },
    ],
  },
  {
    name: "الحدائق والمساحات الخارجية",
    icon: "https://res.cloudinary.com/dpmsou908/image/upload/v1762124240/sa3tha%20services%20images/1762124235013-Picsart_25-11-02_22-46-14-676.png.png",
    description: "خدمات لجعل مساحتك الخارجية جميلة وصحية.",
    subservices: [
      {
        name: "البستنة",
        description: "الزراعة وإزالة الأعشاب والصيانة العامة للحديقة.",
      },
      {
        name: "تنسيق الحدائق",
        description: "تصميم وإنشاء مساحات خارجية جميلة.",
      },
      {
        name: "تقليم الأشجار",
        description:
          "تقليم وقص الأشجار بأمان للصحة والجمال.",
      },
      {
        name: "العناية بالمسطحات الخضراء",
        description: "القص والتسميد والحفاظ على مسطح أخضر صحي.",
      },
    ],
  },
  {
    name: "الخدمات التقنية",
    icon: "https://res.cloudinary.com/dpmsou908/image/upload/v1762124294/sa3tha%20services%20images/1762124289097-Picsart_25-11-02_22-45-19-194.png.png",
    description: "التركيب والإصلاح لاحتياجاتك التقنية.",
    subservices: [
      {
        name: "إصلاح الكمبيوتر",
        description: "تشخيص وإصلاح مشاكل الأجهزة والبرامج.",
      },
      {
        name: "إعداد الشبكات",
        description:
          "تركيب وتكوين شبكات الواي فاي المنزلية أو المكتبية.",
      },
      {
        name: "تركيب المنزل الذكي",
        description: "إعداد الإضاءة الذكية ومكبرات الصوت وأنظمة الأمان.",
      },
      {
        name: "تركيب كاميرات المراقبة",
        description:
          "تركيب كاميرات الأمان لمراقبة المنزل أو العمل.",
      },
    ],
  },
  {
    name: "النقل والشحن",
    icon: "https://res.cloudinary.com/dpmsou908/image/upload/v1762124385/sa3tha%20services%20images/1762124380933-Picsart_25-11-02_22-43-35-135.png.png",
    description: "مساعدتك في نقل ممتلكاتك بأمان وكفاءة.",
    subservices: [
      {
        name: "نقل الأثاث",
        description: "نقل الأثاث والأغراض الثقيلة بأمان.",
      },
      {
        name: "خدمات التعبئة",
        description: "تعبئة ممتلكاتك بشكل آمن للنقل.",
      },
      {
        name: "التخزين",
        description: "توفير حلول تخزين قصيرة أو طويلة الأجل.",
      },
    ],
  },
  {
    name: "خدمات أخرى",
    icon: "https://res.cloudinary.com/dpmsou908/image/upload/v1762125181/sa3tha%20services%20images/1762125174791-Gemini_Generated_Image_fvntx1fvntx1fvnt.png.png",
    description: "مجموعة متنوعة من الخدمات المتخصصة لمنزلك أو عملك.",
    subservices: [
      {
        name: "مكافحة الحشرات",
        description:
          "إبادة ومنع الآفات مثل الحشرات والقوارض.",
      },
      {
        name: "تنظيف خزانات المياه",
        description:
          "تنظيف وتعقيم صحي لخزانات تخزين المياه.",
      },
      {
        name: "تركيب الأقمار الصناعية",
        description: "إعداد ومحاذاة أطباق الأقمار الصناعية للتلفزيون.",
      },
      {
        name: "التصميم الداخلي",
        description: "تخطيط وتصميم المساحات الداخلية لمنزلك.",
      },
    ],
  },
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    // Removed deprecated options: useNewUrlParser and useUnifiedTopology
    await mongoose.connect(DB_URI);
    console.log("Database connected.");

    console.log("Clearing old data...");
    // Clear subservices first because they reference services
    await SubService.deleteMany({});
    await Service.deleteMany({});
    console.log("Old data cleared.");

    console.log("Starting to seed data...");

    // Iterate over each service category
    for (const serviceData of servicesData) {
      // Create and save the main service
      const service = new Service({
        name: serviceData.name,
        icon: serviceData.icon,
        description: serviceData.description,
      });
      await service.save();

      // Prepare subservices with the new service's ID
      const subServicesToCreate = serviceData.subservices.map((sub) => ({
        name: sub.name,
        description: sub.description,
        service: service._id, // Link to the parent service
      }));

      // Insert all subservices for this service
      if (subServicesToCreate.length > 0) {
        await SubService.insertMany(subServicesToCreate);
      }

      console.log(
        `Seeded service: ${service.name} with ${subServicesToCreate.length} subservices.`,
      );
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    console.log("Closing database connection...");
    await mongoose.connection.close();
  }
};

// Run the seeder
seedDatabase();
