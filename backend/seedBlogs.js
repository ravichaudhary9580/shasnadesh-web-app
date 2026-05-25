require('dotenv').config()
const mongoose = require('mongoose')
const Blog = require('./models/Blog')
const connectDB = require('./config/db')
const slugify = require('./utils/slugify')

const categories = ["education", "culture", "society", "news"]

const dummyPDFs = [
  { title: "Research Paper 2024", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { title: "Annual Report", url: "https://www.africau.edu/images/default/sample.pdf" },
  { title: "Policy Document", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
  { title: "Study Material", url: "https://www.africau.edu/images/default/sample.pdf" }
]

const educationTitles = [
  "New National Education Policy Impact",
  "Digital Education Challenges in Rural Areas",
  "Education System Reform Needs",
  "Higher Education Employment Opportunities",
  "Primary Education Quality Improvement",
  "Teacher Training Innovation",
  "Vocational Education Importance",
  "Student Skill Development Programs",
  "Technology Use in Education",
  "Mother Tongue Education Importance",
  "Equality and Inclusion in Education",
  "Future of Online Education",
  "Research and Development in Education",
  "Scholarship Schemes Impact",
  "Private Sector Role in Education",
  "Special Education Needs",
  "Curriculum Reform in Education",
  "Education and Employment Relationship",
  "Examination System Changes",
  "Parents Role in Education"
]

const cultureTitles = [
  "Indian Cultural Diversity and Unity",
  "Folk Art and Traditions Preservation",
  "Cultural Significance of Indian Festivals",
  "Classical Music and Dance Heritage",
  "Global Importance of Indian Handicrafts",
  "Cultural Tourism Development",
  "Richness of Indian Languages",
  "Modern Use of Traditional Knowledge",
  "Diversity of Indian Cuisine",
  "Cultural Importance of Religious Sites",
  "Folk Literature and Stories",
  "Features of Indian Architecture",
  "Digitization of Cultural Heritage",
  "Tribal Culture Preservation",
  "Cultural Impact of Indian Cinema",
  "Yoga and Ayurveda Tradition",
  "Modern Trends in Indian Art",
  "Cultural Exchange Programs",
  "Rich Tradition of Indian Literature",
  "Revival of Traditional Games"
]

const societyTitles = [
  "Women Empowerment Need in Society",
  "Rural Development Challenges and Solutions",
  "Social Justice and Equality",
  "Youth Social Responsibility",
  "Elderly Care and Respect",
  "Child Rights Protection",
  "Social Security Schemes",
  "Elimination of Caste Discrimination",
  "Urbanization and Social Change",
  "Community Development Programs",
  "Social Media Impact",
  "Changing Values in Family and Society",
  "Social Entrepreneurship Importance",
  "Poverty Eradication Efforts",
  "Health and Hygiene Awareness",
  "Social Harmony and Unity",
  "Rights of Disabled Persons",
  "Role of Social Organizations",
  "Anti-Drug Campaign in Society",
  "Youth Contribution to Social Change"
]

const newsTitles = [
  "National Development Plans Progress",
  "Economic Reforms Impact",
  "New Initiatives in Agriculture Sector",
  "Healthcare Services Improvement",
  "Infrastructure Development",
  "New Employment Generation Opportunities",
  "Environmental Conservation Efforts",
  "Digital India Achievements",
  "Progress in Science and Technology",
  "India in International Relations",
  "Self-Reliance in Defense Sector",
  "Innovation in Energy Sector",
  "Transport and Communication Development",
  "Urban Development Projects",
  "Water Conservation and Management",
  "Sports and Youth Development",
  "Tourism Industry Development",
  "Micro Small and Medium Enterprises",
  "Financial Inclusion Efforts",
  "Public Services Improvement"
]

const generateContent = (title, category) => {
  return `
    <h2>${title}</h2>
    <p>यह ${category} श्रेणी में एक महत्वपूर्ण विषय है जो हमारे समाज और राष्ट्र के विकास में महत्वपूर्ण भूमिका निभाता है।</p>
    
    <h3>प्रस्तावना</h3>
    <p>भारत एक विकासशील देश है जहां ${category} के क्षेत्र में निरंतर प्रगति हो रही है। इस विषय पर गहन चर्चा और विश्लेषण की आवश्यकता है।</p>
    
    <h3>वर्तमान स्थिति</h3>
    <p>वर्तमान में ${category} के क्षेत्र में कई चुनौतियां और अवसर मौजूद हैं। सरकार और नागरिक समाज दोनों इस दिशा में सक्रिय रूप से कार्य कर रहे हैं।</p>
    
    <h3>मुख्य बिंदु</h3>
    <ul>
      <li>नीतिगत सुधारों की आवश्यकता</li>
      <li>जन जागरूकता का महत्व</li>
      <li>संसाधनों का उचित उपयोग</li>
      <li>तकनीकी नवाचार का समावेश</li>
      <li>सामुदायिक भागीदारी</li>
    </ul>
    
    <h3>चुनौतियां</h3>
    <p>इस क्षेत्र में कई चुनौतियां हैं जिनका समाधान आवश्यक है। संसाधनों की कमी, जागरूकता की कमी, और पारंपरिक सोच कुछ प्रमुख बाधाएं हैं।</p>
    
    <h3>समाधान और सुझाव</h3>
    <p>इन चुनौतियों का समाधान सामूहिक प्रयासों से संभव है। सरकारी योजनाओं का प्रभावी क्रियान्वयन, जन भागीदारी, और नवाचार इस दिशा में महत्वपूर्ण कदम हैं।</p>
    
    <h3>भविष्य की संभावनाएं</h3>
    <p>भविष्य में ${category} के क्षेत्र में उल्लेखनीय प्रगति की संभावना है। सही नीतियों और प्रयासों से हम अपने लक्ष्यों को प्राप्त कर सकते हैं।</p>
    
    <h3>निष्कर्ष</h3>
    <p>यह विषय राष्ट्रीय विकास के लिए अत्यंत महत्वपूर्ण है। सभी हितधारकों को मिलकर इस दिशा में कार्य करना चाहिए।</p>
  `
}

const generateExcerpt = (title) => {
  return `${title} पर विस्तृत विश्लेषण और चर्चा। इस लेख में हम इस महत्वपूर्ण विषय के विभिन्न पहलुओं पर प्रकाश डालेंगे।`
}

const seed = async () => {
  try {
    await connectDB()
    console.log('Connected to database')

    const allBlogs = []
    let counter = 1

    for (const category of categories) {
      let titles
      switch(category) {
        case 'education': titles = educationTitles; break
        case 'culture': titles = cultureTitles; break
        case 'society': titles = societyTitles; break
        case 'news': titles = newsTitles; break
      }

      for (let i = 0; i < 20; i++) {
        const title = titles[i]
        const baseSlug = slugify(title)
        let slug = baseSlug
        let slugCounter = 1
        
        while (await Blog.exists({ slug })) {
          slug = `${baseSlug}-${slugCounter++}`
        }

        const blog = {
          title,
          slug,
          excerpt: generateExcerpt(title),
          content: generateContent(title, category),
          category,
          tags: [category, 'भारत', 'विकास', 'समाज'],
          status: 'published',
          thumbnail: `https://picsum.photos/seed/${counter}/800/600`,
          pdfs: [
            dummyPDFs[Math.floor(Math.random() * dummyPDFs.length)],
            dummyPDFs[Math.floor(Math.random() * dummyPDFs.length)]
          ],
          views: Math.floor(Math.random() * 1000) + 100,
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date within last 90 days
        }

        allBlogs.push(blog)
        counter++
      }
    }

    await Blog.insertMany(allBlogs)
    console.log(`✅ Successfully seeded ${allBlogs.length} blogs (20 per category)`)
    console.log('Categories:', categories.join(', '))
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding blogs:', error)
    process.exit(1)
  }
}

seed()
