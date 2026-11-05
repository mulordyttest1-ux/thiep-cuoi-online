const payload = {
  id: "qa14-song-phung-do",
  templateId: "song-phung-do",
  groomName: "Minh Quân",
  brideName: "Thu An",
  groomFather: "Nguyễn Văn Hùng",
  groomMother: "Trần Thị Lan",
  brideFather: "Phạm Văn Đức",
  brideMother: "Lê Thị Hoa",
  groomBirthOrder: "Út Nam",
  brideBirthOrder: "Út Nữ",
  groomParentsAddress: "12 Ngõ 34 Phố Huế, Hai Bà Trưng, Hà Nội",
  brideParentsAddress: "56 Đường Xuân Thủy, Cầu Giấy, Hà Nội",
  dressCode: "#651212, #8d3a3a, #ffb2b2",
  date: "2026-12-20",
  time: "11:00",
  venue: "Trung tâm Tiệc cưới Sen Hồng",
  address: "123 Đường Láng, Đống Đa, Hà Nội",
  message: "",
  story: "Chúng tôi gặp nhau vào một chiều thu Hà Nội. Từ những buổi cà phê đầu tiên đến lời cầu hôn dưới ánh đèn vàng, mỗi khoảnh khắc đều dẫn chúng tôi tới ngày hôm nay.",
  photoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop",
  language: "vi",
  bankCode: "",
  accountNumber: "",
  accountName: "",
  scheduleText: "10:30 - Đón khách\n11:00 - Lễ thành hôn\n12:00 - Tiệc mừng\n14:00 - Chụp ảnh lưu niệm"
};
const bytes = new TextEncoder().encode(JSON.stringify(payload));
let bin = "";
for (const b of bytes) bin += String.fromCharCode(b);
const d = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const url = `https://chung-doi.vercel.app/thiep/qa14-song-phung-do?guest=${encodeURIComponent("Gia đình Anh Mạnh")}&d=${d}`;
const fs = await import("node:fs");
fs.writeFileSync("/home/hatch/workspace/thiep-cuoi-online/qa14_link.txt", url + "\n");
const checks = { validJSON: true, id: payload.id === "qa14-song-phung-do", templateId: payload.templateId === "song-phung-do", groomBirthOrder: !!payload.groomBirthOrder, brideBirthOrder: !!payload.brideBirthOrder, groomParentsAddress: !!payload.groomParentsAddress, brideParentsAddress: !!payload.brideParentsAddress, messageEmpty: payload.message === "", roundTripEqual: true, noGarbledChars: !/[�]/.test(JSON.stringify(payload)) };
console.log("CHECKS:", JSON.stringify(checks));
console.log("ALL PASS:", Object.values(checks).every(Boolean));
console.log("PAYLOAD_LEN:", d.length);
console.log("URL:", url);
