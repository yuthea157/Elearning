import { getFeaturedCourses, getTrendingCourses, getCategories } from "@/lib/data/courses";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { CourseRow } from "@/components/home/course-row";
import { Benefits } from "@/components/home/benefits";
import { Testimonials } from "@/components/home/testimonials";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { Faq } from "@/components/home/faq";

export default async function HomePage() {
  const [featured, trending, categories] = await Promise.all([
    getFeaturedCourses(),
    getTrendingCourses(),
    getCategories(),
  ]);

  return (
    <>
      <Hero />
      <CourseRow title="Featured courses" description="Hand-picked by our team" courses={featured} viewAllHref="/courses" />
      <CategoryGrid categories={categories} />
      <CourseRow title="Trending now" description="Popular with learners this month" courses={trending} viewAllHref="/courses?sort=popular" />
      <Benefits />
      <Testimonials />
      <PricingTeaser />
      <Faq />
    </>
  );
}
