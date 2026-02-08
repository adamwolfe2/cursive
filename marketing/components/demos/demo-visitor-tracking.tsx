"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"

interface Visitor {
  id: string
  name: string
  email: string
  phone: string
  page: string
  enrichmentStep: number
}

const firstNames = [
  "Sarah", "Mike", "Jessica", "David", "Rachel", "Tom", "Amanda", "James",
  "Nicole", "Ryan", "Olivia", "Marcus", "Priya", "Alex", "Megan", "Chris",
  "Danielle", "Brian", "Samantha", "Kevin", "Lauren", "Derek", "Vanessa",
  "Eric", "Kaitlyn", "Jason", "Heather", "Tyler", "Monica", "Nathan",
  "Brooke", "Justin", "Allison", "Brandon", "Tiffany", "Jordan", "Cassandra",
  "Aaron", "Victoria", "Patrick", "Lindsay", "Corey", "Stephanie", "Trevor",
  "Natalie", "Garrett", "Katherine", "Ian", "Christina", "Wesley",
]

const lastNames = [
  "Johnson", "Chen", "Rodriguez", "Park", "Martinez", "Anderson", "Patel",
  "Thompson", "Kim", "Lewis", "Walker", "Davis", "Wilson", "Moore", "Taylor",
  "Jackson", "White", "Harris", "Clark", "Allen", "Young", "King", "Wright",
  "Scott", "Hill", "Adams", "Baker", "Nelson", "Carter", "Mitchell",
  "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans",
  "Edwards", "Collins", "Stewart", "Morris", "Rivera", "Cooper", "Reed",
  "Bailey", "Bell", "Murphy", "Brooks", "Foster", "Sanders",
]

const domains = [
  "acmecorp.com", "techstart.io", "saasco.com", "innovate.co", "growth.io",
  "scale.ai", "cloudnine.dev", "brightpath.com", "nextera.io", "synapse.co",
  "dataflow.ai", "primevault.com", "hyperloop.io", "stratify.co", "optima.ai",
  "zenith.dev", "catalyst.io", "momentum.co", "pinnacle.ai", "vertex.dev",
]

const pages = [
  "/pricing", "/features", "/demo", "/platform", "/contact",
  "/about", "/blog", "/integrations", "/case-studies", "/solutions",
]

const areaCodes = ["555", "415", "212", "512", "206", "305", "617", "310", "720", "503"]

let nameIndex = 0

function generateVisitor(): Omit<Visitor, "id" | "enrichmentStep"> {
  const first = firstNames[nameIndex % firstNames.length]
  const last = lastNames[Math.floor(nameIndex / firstNames.length) % lastNames.length]
  nameIndex++
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const emailPrefix = `${first.toLowerCase().charAt(0)}.${last.toLowerCase()}`
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)]
  const phone = `(${areaCode}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`

  return {
    name: `${first} ${last}`,
    email: `${emailPrefix}@${domain}`,
    phone,
    page: pages[Math.floor(Math.random() * pages.length)],
  }
}

export function DemoVisitorTracking() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [totalToday, setTotalToday] = useState(10500)
  const [liveCount, setLiveCount] = useState(4800)
  const tickRef = useRef(0)

  // Initialize with 5 visitors
  useEffect(() => {
    const initial = Array.from({ length: 5 }, (_, i) => ({
      ...generateVisitor(),
      id: `init-${i}`,
      enrichmentStep: 4,
    }))
    setVisitors(initial)
  }, [])

  // Add new visitors fast — every 1.8s
  useEffect(() => {
    const interval = setInterval(() => {
      const v = generateVisitor()
      const newVisitor: Visitor = {
        ...v,
        id: `v-${Date.now()}-${Math.random()}`,
        enrichmentStep: 0,
      }

      setVisitors(prev => [newVisitor, ...prev].slice(0, 5))
      setTotalToday(prev => prev + Math.floor(Math.random() * 3) + 1)
      setLiveCount(prev => prev + Math.floor(Math.random() * 3) + 1)
    }, 1800)

    return () => clearInterval(interval)
  }, [])

  // Enrich new visitors quickly
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitors(prev =>
        prev.map(visitor =>
          visitor.enrichmentStep < 4
            ? { ...visitor, enrichmentStep: visitor.enrichmentStep + 1 }
            : visitor
        )
      )
    }, 400)

    return () => clearInterval(interval)
  }, [])

  // Steadily tick up counters between visitor adds
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++
      if (tickRef.current % 2 === 0) {
        setTotalToday(prev => prev + 1)
      }
      if (tickRef.current % 3 === 0) {
        setLiveCount(prev => prev + (Math.random() > 0.3 ? 1 : 0))
      }
    }, 600)

    return () => clearInterval(interval)
  }, [])

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
  }

  return (
    <div className="space-y-2">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg p-2.5 border border-gray-200"
        >
          <motion.div
            key={totalToday}
            initial={{ scale: 1.1, color: "#007AFF" }}
            animate={{ scale: 1, color: "#111827" }}
            transition={{ duration: 0.3 }}
            className="text-xl text-gray-900 font-light"
          >
            {formatCount(totalToday)}
          </motion.div>
          <div className="text-xs text-gray-600">Identified Today</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg p-2.5 border border-gray-200"
        >
          <motion.div
            key={liveCount}
            initial={{ scale: 1.1, color: "#10B981" }}
            animate={{ scale: 1, color: "#111827" }}
            transition={{ duration: 0.3 }}
            className="text-xl text-gray-900 font-light"
          >
            {formatCount(liveCount)}
          </motion.div>
          <div className="text-xs text-gray-600">Live Now</div>
        </motion.div>
      </div>

      {/* Live Visitors Stream */}
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
          />
          <h4 className="text-xs text-gray-900 font-medium">Live Visitors</h4>
        </div>

        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {visitors.map((visitor) => (
              <motion.div
                key={visitor.id}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, x: -100, height: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                layout
                className="bg-white rounded-md p-2 border border-gray-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: visitor.enrichmentStep >= 1 ? 1 : 0.3 }}
                        className="text-xs text-gray-900 font-medium truncate"
                      >
                        {visitor.enrichmentStep >= 1 ? visitor.name : "Identifying..."}
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: visitor.enrichmentStep >= 2 ? 1 : 0.3 }}
                        className="text-[10px] text-[#007AFF] truncate"
                      >
                        {visitor.enrichmentStep >= 2 ? visitor.page : ""}
                      </motion.span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: visitor.enrichmentStep >= 3 ? 1 : 0.3 }}
                        className="text-[10px] text-gray-500 truncate"
                      >
                        {visitor.enrichmentStep >= 3 ? visitor.email : "Enriching..."}
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: visitor.enrichmentStep >= 4 ? 1 : 0.3 }}
                        className="text-[10px] text-gray-500 truncate"
                      >
                        {visitor.enrichmentStep >= 4 ? visitor.phone : ""}
                      </motion.span>
                    </div>
                  </div>
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full flex items-center gap-1 flex-shrink-0"
                  >
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1 h-1 bg-blue-500 rounded-full"
                    />
                    Live
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
