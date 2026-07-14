import { Card, CardContent } from '../../../components/ui/card';
import { GraduationCap, Users, Clock, Award, UserCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router';

const workshops = [
  {
    title: 'Advanced Refresh Course',
    duration: '3 sessions · 4 hours each',
    level: 'Intermediate to Advanced',
    classType: 'Private or small group (max 3 students)',
    description: 'For experienced nail artists looking to update their skills and refine modern techniques.',
    highlights: ['Skill refinement', 'Modern techniques', 'Industry updates', 'Hands-on practice'],
    sectionId: 'advanced-nail-course',
  },
  {
    title: 'Complete Nail Course',
    duration: '5 sessions · 5 hours each',
    level: 'Beginner',
    classType: 'Private or small group (max 3 students)',
    description: 'A full programme for beginners, covering everything from foundation to professional-level skills.',
    highlights: ['Foundation techniques', 'Professional skills', 'Comprehensive training', 'Hands-on practice'],
    sectionId: 'complete-nail-course',
  },
];

export function Training() {
  const navigate = useNavigate();

  const handleNavigateToWorkshops = () => {
    navigate('/workshops');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleNavigateToWorkshop = (sectionId: string) => {
    navigate('/workshops');
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <section id="training" className="pt-8 md:pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-left md:text-center mb-16">
          <h2 className="font-semibold text-gray-800 mb-4">Pearl Wishes Studio Training</h2>
          <h3 className="text-gray-700 mb-4">Master the Art of Luxury Nails</h3>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            From foundation to advanced bridal & VIP skills
          </p>
          <Button
            className="transition-all"
            style={{
              backgroundColor: '#3D3935',
              background: '#3D3935',
              color: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F1F1F';
              e.currentTarget.style.background = '#1F1F1F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3D3935';
              e.currentTarget.style.background = '#3D3935';
            }}
            onClick={handleNavigateToWorkshops}
          >
            <span style={{
              background: 'linear-gradient(to right, #FCEAE0, #EACAB8)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}>
              Start Your Journey
            </span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {workshops.map((workshop, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Color Block Placeholder */}
              <div className="h-48" style={{ backgroundColor: '#DCD4CD' }}></div>
              
              <CardContent className="p-6">
                <h3 className="mb-3">{workshop.title}</h3>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{workshop.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">{workshop.level}</span>
                  </div>
                  {workshop.classType && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserCheck className="w-4 h-4" />
                      <span className="text-sm">{workshop.classType}</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 mb-4">
                  {workshop.description}
                </p>

                <div className="mb-4">
                  <div className="text-sm mb-2" style={{ color: '#3D3935' }}>Course Highlights:</div>
                  <ul className="grid grid-cols-2 gap-2">
                    {workshop.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className="w-full transition-colors"
                  style={{
                    background: 'linear-gradient(to right, #FCEAE0, #EACAB8)',
                    color: '#3D3935'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #D0A096, #D0A096)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #FCEAE0, #EACAB8)';
                  }}
                  onClick={() => handleNavigateToWorkshop(workshop.sectionId)}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}