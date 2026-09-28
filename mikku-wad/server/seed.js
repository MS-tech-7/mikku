require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Service = require('./models/Service');
const Task = require('./models/Task');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mikku';

async function seed() {
  await mongoose.connect(uri);
  await User.deleteMany({});
  await Service.deleteMany({});
  await Task.deleteMany({});

  const hash = p => bcrypt.hash(p, 10);
  const [studentPass, teacherPass, societyPass] = await Promise.all([
    hash('student123'), hash('teacher123'), hash('society123')
  ]);

  const [student, teacher, society] = await User.create([
    {
      username: 'student1', password: studentPass, name: 'Akhil Student',
      phone: '9876543210', idCard: 'GECB-STU-001', role: 'student',
      department: 'Information Technology', year: 'S3',
      skills: ['Graphic Design', 'Video Editing'], rating: 4.5, ratingCount: 8
    },
    {
      username: 'teacher1', password: teacherPass, name: 'Anita Teacher',
      phone: '9876543211', idCard: 'GECB-FAC-001', role: 'teacher',
      department: 'Information Technology', year: 'Faculty',
      skills: ['Web Development', 'Mentoring']
    },
    {
      username: 'society1', password: societyPass, name: 'Mikku Society Head',
      phone: '9876543212', idCard: 'GECB-SOC-001', role: 'society_head',
      department: 'College Union', year: 'Coordinator',
      skills: ['Event Management', 'Content Writing']
    }
  ]);

  await Service.create([
    {
      title: 'College Event Poster Design',
      description: 'Clean and attractive poster for department or club events.',
      category: 'Design', price: 200,
      skills: ['Photoshop', 'Canva', 'Figma'], owner: student._id
    },
    {
      title: 'Basic Website Development',
      description: 'Simple responsive website for a club, society or student project.',
      category: 'Web Development', price: 800,
      skills: ['HTML', 'CSS', 'JavaScript'], owner: teacher._id
    }
  ]);

  await Task.create({
    title: 'Need a poster for our department event',
    description: 'Create an Instagram/poster design for an upcoming department programme.',
    category: 'Design', budget: 300,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), owner: society._id
  });

  console.log('Mikku demo data created.');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
