import React from 'react';
import { Users, Award, Clock, Target } from 'lucide-react';

const AboutSection = () => {
  const stats = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      number: "50+",
      label: "Happy Clients"
    },
    {
      icon: <Award className="w-8 h-8 text-blue-600" />,
      number: "100+",
      label: "Projects Completed"
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      number: "5+",
      label: "Years Experience"
    },
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      number: "99%",
      label: "Success Rate"
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              About Our Company
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              We are a passionate team of developers and designers dedicated to creating 
              exceptional digital experiences. With years of experience in the industry, 
              we help businesses transform their ideas into powerful digital solutions.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Our mission is to deliver high-quality, scalable, and innovative technology 
              solutions that drive business growth and exceed client expectations.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  Expert team with proven track record
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  Cutting-edge technologies and best practices
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  Agile development methodology
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  24/7 support and maintenance
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  Competitive pricing and timely delivery
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;