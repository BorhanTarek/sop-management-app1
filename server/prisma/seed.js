const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LINE3_STATIONS = [
  { name: 'Adly Mansour',         nameAr: 'عدلي منصور',           stationCode: 'L3-01', sortOrder: 1 },
  { name: 'El Haykestep',         nameAr: 'الهايكستب',            stationCode: 'L3-02', sortOrder: 2 },
  { name: 'Omar Ibn El Khattab',  nameAr: 'عمر بن الخطاب',        stationCode: 'L3-03', sortOrder: 3 },
  { name: 'Koleyet El Zeraa',     nameAr: 'كلية الزراعة',          stationCode: 'L3-04', sortOrder: 4 },
  { name: 'El Ahram',             nameAr: 'الأهرام',               stationCode: 'L3-05', sortOrder: 5 },
  { name: 'Heliopolis',           nameAr: 'مصر الجديدة',           stationCode: 'L3-06', sortOrder: 6 },
  { name: 'Haroun',               nameAr: 'هارون',                 stationCode: 'L3-07', sortOrder: 7 },
  { name: 'Stadium',              nameAr: 'الاستاد',               stationCode: 'L3-08', sortOrder: 8 },
  { name: 'Fair Grounds',         nameAr: 'أرض المعارض',           stationCode: 'L3-09', sortOrder: 9 },
  { name: 'Abbassia',             nameAr: 'العباسية',              stationCode: 'L3-10', sortOrder: 10 },
  { name: 'Abdou Basha',          nameAr: 'عبده باشا',             stationCode: 'L3-11', sortOrder: 11 },
  { name: 'El Geyoushia',         nameAr: 'الجيوشية',              stationCode: 'L3-12', sortOrder: 12 },
  { name: 'Hadayeq El Zaytoun',   nameAr: 'حدائق الزيتون',         stationCode: 'L3-13', sortOrder: 13 },
  { name: 'Helmeyet El Zaytoun',  nameAr: 'حلمية الزيتون',         stationCode: 'L3-14', sortOrder: 14 },
  { name: 'El Montaza',           nameAr: 'المنتزه',               stationCode: 'L3-15', sortOrder: 15 },
  { name: 'Ain Shams',            nameAr: 'عين شمس',               stationCode: 'L3-16', sortOrder: 16 },
  { name: 'El Matareyya',         nameAr: 'المطرية',               stationCode: 'L3-17', sortOrder: 17 },
  { name: 'Khalafawy',            nameAr: 'خلفاوي',                stationCode: 'L3-18', sortOrder: 18 },
  { name: 'St. Teresa',           nameAr: 'سانت تريزا',            stationCode: 'L3-19', sortOrder: 19 },
  { name: 'Rod El Farag Axis',    nameAr: 'محور روض الفرج',        stationCode: 'L3-20', sortOrder: 20 },
  { name: 'Masarra',              nameAr: 'مسرة',                  stationCode: 'L3-21', sortOrder: 21 },
  { name: 'Al Khalig Al Masry',   nameAr: 'الخليج المصري',         stationCode: 'L3-22', sortOrder: 22 },
  { name: 'Bab El Shaaria',       nameAr: 'باب الشعرية',           stationCode: 'L3-23', sortOrder: 23 },
  { name: 'Attaba',               nameAr: 'العتبة',                stationCode: 'L3-24', sortOrder: 24 },
  { name: 'Nasser',               nameAr: 'ناصر',                  stationCode: 'L3-25', sortOrder: 25 },
  { name: 'Maspero',              nameAr: 'ماسبيرو',               stationCode: 'L3-26', sortOrder: 26 },
  { name: 'Safaa Hegazy',         nameAr: 'صفاء حجازي',            stationCode: 'L3-27', sortOrder: 27 },
  { name: 'Kit Kat',              nameAr: 'كيت كات',               stationCode: 'L3-28', sortOrder: 28 },
];

const NEW_ROLES = [
  { name: 'admin', description: 'Administrator — full access' },
  { name: 'station_manager', description: 'Station Manager — view, edit, add station SOPs' },
  { name: 'station_master', description: 'Station Master — restricted to assigned stations only' },
  { name: 'transport_manager', description: 'Transport Manager — edit, add, view SOPs' },
  { name: 'driver', description: 'Driver — viewer access to SOPs' },
  { name: 'occ', description: 'OCC — viewer access to SOPs' },
];

async function main() {
  console.log('Seeding roles...');
  
  // Create or update the new exact set of roles
  for (const role of NEW_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  
  // Remove old generic roles (editor, viewer) to enforce the new strict categories
  await prisma.role.deleteMany({
    where: { name: { in: ['editor', 'viewer'] } }
  });
  
  console.log('New role system seeded');

  console.log('Seeding Cairo Metro Line 3 stations...');

  for (const station of LINE3_STATIONS) {
    await prisma.station.upsert({
      where: { stationCode: station.stationCode },
      update: { name: station.name, nameAr: station.nameAr, sortOrder: station.sortOrder },
      create: { ...station, lineCode: 'L3', isActive: true },
    });
  }
  console.log(`${LINE3_STATIONS.length} Cairo Line 3 stations seeded`);

  console.log('Seeding default admin user...');
  const bcrypt = require('bcryptjs');
  const adminEmail = 'admin';
  const adminPassword = '123123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      roles: {
        create: {
          roleId: adminRole.id
        }
      }
    }
  });
  console.log(`Default admin user seeded: ${adminEmail} (password: ${adminPassword})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
