import React from 'react';
import { Code, Smartphone, Globe, Zap } from 'lucide-react';

const ServicesSection = () => {
  const services = [
    {
      icon: <Code className="w-12 h-12 text-blue-600" />,
      title: "Web Development",
      description: "Custom web applications built with modern technologies like React, Next.js, and Node.js."
    },
    {
      icon: <Smartphone className="w-12 h-12 text-blue-600" />,
      title: "Mobile Apps",
      description: "Native and cross-platform mobile applications for iOS and Android using React Native."
    },
    {
      icon: <Globe className="w-12 h-12 text-blue-600" />,
      title: "Digital Solutions",
      description: "End-to-end digital transformation solutions to modernize your business processes."
    },
    {
      icon: <Zap className="w-12 h-12 text-blue-600" />,
      title: "Performance Optimization",
      description: "Speed up your applications and improve user experience with our optimization services."
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We offer comprehensive technology solutions to help your business thrive in the digital age.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                {service.title}
              </h3>
              <p className="text-gray-600 text-center">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;