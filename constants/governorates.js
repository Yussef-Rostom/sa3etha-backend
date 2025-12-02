const GOVERNORATES = [
    { id: 1, name: "القاهرة" },
    { id: 2, name: "الجيزة" },
    { id: 3, name: "الإسكندرية" },
    { id: 4, name: "الدقهلية" },
    { id: 5, name: "البحر الأحمر" },
    { id: 6, name: "البحيرة" },
    { id: 7, name: "الفيوم" },
    { id: 8, name: "الغربية" },
    { id: 9, name: "الإسماعيلية" },
    { id: 10, name: "المنوفية" },
    { id: 11, name: "القليوبية" },
    { id: 12, name: "الوادي الجديد" },
    { id: 13, name: "السويس" },
    { id: 14, name: "الشرقية" },
    { id: 15, name: "أسوان" },
    { id: 16, name: "بني سويف" },
    { id: 17, name: "بورسعيد" },
    { id: 18, name: "جنوب سيناء" },
    { id: 19, name: "كفر الشيخ" },
    { id: 20, name: "مطروح" },
    { id: 21, name: "قنا" },
    { id: 22, name: "شمال سيناء" },
    { id: 23, name: "أسيوط" },
    { id: 24, name: "سوهاج" },
    { id: 25, name: "الأقصر" },
    { id: 26, name: "دمياط" },
    { id: 27, name: "المنيا" },
];

const getGovernorateNameById = (id) => {
    const governorate = GOVERNORATES.find((g) => g.id === parseInt(id));
    return governorate ? governorate.name : null;
};

const getGovernorateIdByName = (name) => {
    const governorate = GOVERNORATES.find((g) => g.name === name);
    return governorate ? governorate.id : null;
};

module.exports = {
    GOVERNORATES,
    getGovernorateNameById,
    getGovernorateIdByName,
};
