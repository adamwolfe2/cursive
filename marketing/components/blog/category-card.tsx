"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, LucideIcon } from "lucide-react"

interface CategoryCardProps {
  title: string
  description: string
  slug: string
  icon: LucideIcon
  gradient: string
  postCount: number
  index?: number
}

export function CategoryCard({
  title,
  description,
  slug,
  icon: Icon,
  gradient,
  postCount,
  index = 0,
}: CategoryCardProps) {
  return (
    <Link href={`/blog/${slug}`}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col"
      >
        <div className={`aspect-video ${gradient} flex items-center justify-center relative overflow-hidden`}>
          <Icon className="w-16 h-16 text-white z-10" />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
            {description}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">{postCount} articles</span>
            <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}
