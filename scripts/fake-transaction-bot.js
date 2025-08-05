// Fake Transaction Bot for Taxxy - Generates realistic freelancer/marketplace seller transactions
// Run this in your Next.js project to populate test data

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client with service role (bypasses RLS for scripts)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Service role bypasses RLS
)

// Transaction categories with realistic descriptions and amounts
const transactionTemplates = {
  // Business expenses (write-offs)
  supplies: [
    { desc: "Amazon - Craft supplies for Etsy store", range: [15, 85] },
    { desc: "Michaels - Fabric and buttons", range: [22, 95] },
    { desc: "Staples - Shipping boxes and labels", range: [18, 45] },
    { desc: "Home Depot - Storage containers", range: [35, 120] },
    { desc: "Office Depot - Printer ink cartridges", range: [28, 75] }
  ],
  
  platformFees: [
    { desc: "Etsy - Transaction fees", range: [2, 15] },
    { desc: "eBay - Final value fees", range: [3, 25] },
    { desc: "Shopify - Monthly subscription", range: [29, 79] },
    { desc: "PayPal - Processing fees", range: [1, 8] },
    { desc: "Square - Payment processing", range: [2, 12] }
  ],
  
  shipping: [
    { desc: "USPS - Priority mail shipping", range: [8, 35] },
    { desc: "UPS Store - Package shipping", range: [12, 45] },
    { desc: "FedEx - Overnight delivery", range: [25, 85] },
    { desc: "Amazon - Shipping supplies", range: [15, 60] }
  ],
  
  marketing: [
    { desc: "Facebook Ads - Promoted posts", range: [20, 150] },
    { desc: "Google Ads - Product advertising", range: [35, 200] },
    { desc: "Canva Pro - Design subscription", range: [15, 15] },
    { desc: "Mailchimp - Email marketing", range: [10, 50] }
  ],
  
  equipment: [
    { desc: "Best Buy - Photography lighting", range: [45, 200] },
    { desc: "Amazon - Packaging tape dispenser", range: [25, 85] },
    { desc: "Target - Storage shelving", range: [65, 180] },
    { desc: "Walmart - Scale for shipping", range: [35, 120] }
  ],
  
  professional: [
    { desc: "Fiverr - Logo design service", range: [25, 150] },
    { desc: "Upwork - Bookkeeping services", range: [50, 300] },
    { desc: "LegalZoom - Business registration", range: [100, 400] },
    { desc: "QuickBooks - Accounting software", range: [15, 45] }
  ],
  
  // Personal expenses (not write-offs)
  personal: [
    { desc: "Starbucks - Coffee", range: [4, 15] },
    { desc: "McDonald's - Lunch", range: [8, 20] },
    { desc: "Target - Groceries", range: [45, 120] },
    { desc: "Netflix - Streaming service", range: [15, 20] },
    { desc: "Gas Station - Fuel", range: [25, 65] },
    { desc: "Walmart - Personal items", range: [20, 80] },
    { desc: "Amazon - Personal purchase", range: [15, 85] }
  ],
  
  // Income transactions
  income: [
    { desc: "Etsy - Sale payment", range: [15, 200] },
    { desc: "eBay - Item sold", range: [25, 350] },
    { desc: "Shopify - Order payment", range: [35, 150] },
    { desc: "Client payment - Freelance work", range: [100, 1500] },
    { desc: "PayPal - Customer payment", range: [20, 300] }
  ]
}

// Generate random date within last 6 months
function getRandomDate() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000))
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
  return new Date(randomTime).toISOString()
}

// Generate random amount within range
function getRandomAmount(range) {
  return (Math.random() * (range[1] - range[0]) + range[0]).toFixed(2)
}

// Generate single fake transaction
function generateTransaction(userId, forceCategory = null) {
  const categories = Object.keys(transactionTemplates)
  const category = forceCategory || categories[Math.floor(Math.random() * categories.length)]
  const templates = transactionTemplates[category]
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  const amount = parseFloat(getRandomAmount(template.range))
  const isIncome = category === 'income'
  
  return {
    user_id: userId,
    description: template.desc,
    amount: isIncome ? amount : -amount, // Expenses are negative
    date: getRandomDate(),
    category: category === 'income' ? 'income' : 'expense',
    created_at: new Date().toISOString()
  }
}

// Generate batch of realistic transactions with proper distribution
function generateTransactionBatch(userId, count = 50) {
  const transactions = []
  
  // Distribution for realistic freelancer spending patterns
  const distribution = {
    supplies: Math.floor(count * 0.25),      // 25% - Most common expense
    platformFees: Math.floor(count * 0.15),  // 15% - Regular platform costs
    shipping: Math.floor(count * 0.20),      // 20% - Frequent shipping
    marketing: Math.floor(count * 0.05),     // 5% - Occasional marketing
    equipment: Math.floor(count * 0.05),     // 5% - Occasional equipment
    professional: Math.floor(count * 0.05),  // 5% - Occasional services
    personal: Math.floor(count * 0.15),      // 15% - Personal mixed in
    income: Math.floor(count * 0.10)         // 10% - Some income transactions
  }
  
  // Generate transactions based on distribution
  for (const [category, categoryCount] of Object.entries(distribution)) {
    for (let i = 0; i < categoryCount; i++) {
      transactions.push(generateTransaction(userId, category))
    }
  }
  
  // Sort by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
  
  return transactions
}

// Main function to populate database
async function populateDatabase(userId, transactionCount = 100) {
  console.log(`🤖 Generating ${transactionCount} fake transactions for user ${userId}...`)
  
  try {
    // Generate transactions
    const transactions = generateTransactionBatch(userId, transactionCount)
    
    // Insert in batches to avoid rate limits
    const batchSize = 20
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(batch)
      
      if (error) {
        console.error('Error inserting batch:', error)
        continue
      }
      
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transactions.length/batchSize)}`)
    }
    
    console.log(`🎉 Successfully generated ${transactions.length} transactions!`)
    
    // Generate summary
    const summary = {
      totalTransactions: transactions.length,
      totalExpenses: transactions.filter(t => t.amount < 0).length,
      totalIncome: transactions.filter(t => t.amount > 0).length,
      categories: {}
    }
    
    // Count by category
    for (const [category, count] of Object.entries({
      supplies: Math.floor(transactionCount * 0.25),
      platformFees: Math.floor(transactionCount * 0.15),
      shipping: Math.floor(transactionCount * 0.20),
      marketing: Math.floor(transactionCount * 0.05),
      equipment: Math.floor(transactionCount * 0.05),
      professional: Math.floor(transactionCount * 0.05),
      personal: Math.floor(transactionCount * 0.15),
      income: Math.floor(transactionCount * 0.10)
    })) {
      summary.categories[category] = count
    }
    
    console.log('\n📊 Transaction Summary:')
    console.log(JSON.stringify(summary, null, 2))
    
    return summary
    
  } catch (error) {
    console.error('Error populating database:', error)
    throw error
  }
}

// RUN THE BOT IMMEDIATELY
const TEST_USER_ID = 'f7470d05-310f-44c4-a10f-367455e4ca44'

console.log('🤖 Starting fake transaction generation...')
console.log(`Using user ID: ${TEST_USER_ID}`)

populateDatabase(TEST_USER_ID, 50)
  .then((summary) => {
    console.log('✅ Successfully completed!')
    console.log('Check your Supabase dashboard and app!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })