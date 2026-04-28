import JobList from '@/components/job/JobList'
import { PageHeader } from '@/components/custom/page-header'

export default function JobsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Job Postings"
        description="Add job descriptions and optimize your resumes for each position"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Jobs' }
        ]}
      />
      
      {/* Job List */}
      <JobList />
    </div>
  )
}