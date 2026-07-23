const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LINE3_STATIONS = [
  { name: 'Adly Mansour',          nameAr: 'عدلي منصور',            stationCode: 'L3-01', sortOrder: 1 },
  { name: 'El Haykestep',          nameAr: 'الهايكستب',             stationCode: 'L3-02', sortOrder: 2 },
  { name: 'Omar Ibn El-Khattab',   nameAr: 'عمر بن الخطاب',         stationCode: 'L3-03', sortOrder: 3 },
  { name: 'Qobaa',                 nameAr: 'قباء',                 stationCode: 'L3-04', sortOrder: 4 },
  { name: 'Hesham Barakat',        nameAr: 'هشام بركات',           stationCode: 'L3-05', sortOrder: 5 },
  { name: 'El-Nozha',              nameAr: 'النزهة',               stationCode: 'L3-06', sortOrder: 6 },
  { name: 'El Shams Club',         nameAr: 'نادي الشمس',           stationCode: 'L3-07', sortOrder: 7 },
  { name: 'Alf Maskan',            nameAr: 'ألف مسكن',             stationCode: 'L3-08', sortOrder: 8 },
  { name: 'Heliopolis Square',     nameAr: 'ميدان هليوبوليس',      stationCode: 'L3-09', sortOrder: 9 },
  { name: 'Haroun',                nameAr: 'هارون',                stationCode: 'L3-10', sortOrder: 10 },
  { name: 'Al-Ahram',              nameAr: 'الأهرام',              stationCode: 'L3-11', sortOrder: 11 },
  { name: 'Koleyet El-Banat',      nameAr: 'كلية البنات',           stationCode: 'L3-12', sortOrder: 12 },
  { name: 'Stadium',               nameAr: 'الإستاد',              stationCode: 'L3-13', sortOrder: 13 },
  { name: 'Fair Zone',             nameAr: 'أرض المعارض',          stationCode: 'L3-14', sortOrder: 14 },
  { name: 'Abbassia',              nameAr: 'العباسية',             stationCode: 'L3-15', sortOrder: 15 },
  { name: 'Abdou Pasha',           nameAr: 'عبده باشا',            stationCode: 'L3-16', sortOrder: 16 },
  { name: 'El Geish',              nameAr: 'الجيش',                stationCode: 'L3-17', sortOrder: 17 },
  { name: 'Bab El Shaaria',        nameAr: 'باب الشعرية',          stationCode: 'L3-18', sortOrder: 18 },
  { name: 'Attaba',                nameAr: 'العتبة',               stationCode: 'L3-19', sortOrder: 19 },
  { name: 'Nasser',                nameAr: 'جمال عبد الناصر',       stationCode: 'L3-20', sortOrder: 20 },
  { name: 'Maspero',               nameAr: 'ماسبيرو',              stationCode: 'L3-21', sortOrder: 21 },
  { name: 'Safaa Hegazy',          nameAr: 'صفاء حجازي / الزمالك', stationCode: 'L3-22', sortOrder: 22 },
  { name: 'Kit Kat',               nameAr: 'الكيت كات',            stationCode: 'L3-23', sortOrder: 23 },
  { name: 'Sudan',                 nameAr: 'السودان',              stationCode: 'L3-24', sortOrder: 24 },
  { name: 'Imbaba',                nameAr: 'إمبابة',               stationCode: 'L3-25', sortOrder: 25 },
  { name: 'El-Bohy',               nameAr: 'البوهي',               stationCode: 'L3-26', sortOrder: 26 },
  { name: 'El-Qawmia',             nameAr: 'القومية العربية',       stationCode: 'L3-27', sortOrder: 27 },
  { name: 'Ring Road',             nameAr: 'الطريق الدائري',        stationCode: 'L3-28', sortOrder: 28 },
  { name: 'Rod El Farag Corridor', nameAr: 'محور روض الفرج',       stationCode: 'L3-29', sortOrder: 29 },
  { name: 'Tawfikia',              nameAr: 'التوفيقية',            stationCode: 'L3-30', sortOrder: 30 },
  { name: 'Wadi El Nile',          nameAr: 'وادي النيل',           stationCode: 'L3-31', sortOrder: 31 },
  { name: 'Gamaet El-Dowal',       nameAr: 'جامعة الدول العربية',  stationCode: 'L3-32', sortOrder: 32 },
  { name: 'Boulak El Dakrour',     nameAr: 'بولاق الدكرور',        stationCode: 'L3-33', sortOrder: 33 },
  { name: 'Cairo University',      nameAr: 'جامعة القاهرة',        stationCode: 'L3-34', sortOrder: 34 },
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

  const validCodes = LINE3_STATIONS.map(s => s.stationCode);

  // Delete obsolete station SOP mappings for stations being removed
  const obsoleteStations = await prisma.station.findMany({
    where: { stationCode: { notIn: validCodes } },
    select: { id: true }
  });
  const obsoleteIds = obsoleteStations.map(s => s.id);
  if (obsoleteIds.length > 0) {
    await prisma.stationSop.deleteMany({ where: { stationId: { in: obsoleteIds } } });
    await prisma.userStation.deleteMany({ where: { stationId: { in: obsoleteIds } } });
    await prisma.session.deleteMany({ where: { stationId: { in: obsoleteIds } } });
    await prisma.checklistSubmission.deleteMany({ where: { stationId: { in: obsoleteIds } } });
    await prisma.station.deleteMany({ where: { id: { in: obsoleteIds } } });
  }

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
