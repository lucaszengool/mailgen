import React from 'react';

const FloatingTestimonials = () => {
  const testimonials = [
    {
      name: 'Michael R.',
      role: 'VP of Sales',
      initials: 'MR',
      text: 'I am able to find more relevant leads faster, since using this platform I have tripled my outreach response rate. I am truly impressed with the AI matching.'
    },
    {
      name: 'Sarah C.',
      role: 'Marketing Director',
      initials: 'SC',
      text: 'Thanks to this platform I have landed 3 new clients within 2 weeks! The AI-powered prospect matching is absolutely incredible.'
    },
    {
      name: 'David L.',
      role: 'Business Development Manager',
      initials: 'DL',
      text: 'You must check out this platform. It has been saving me hours in prospecting! I am blown away at how easy it is to find qualified leads.'
    },
    {
      name: 'Jennifer W.',
      role: 'Growth Marketing Lead',
      initials: 'JW',
      text: 'I have enjoyed seeing so many perfectly matched prospects. This has completely revamped my outreach process. Excited to keep exploring the features!'
    },
    {
      name: 'Thomas B.',
      role: 'Sales Manager',
      initials: 'TB',
      text: 'It is a 10/10! The email personalization feature helps me easily craft messages that resonate. The AI guidance has been game changing. Loving it so far!'
    },
    {
      name: 'Amanda L.',
      role: 'Account Executive',
      initials: 'AL',
      text: 'Not only does this platform show you the most relevant prospects, it ALSO helps you network and get warm introductions! The matching system is incredible. Definitely recommend!'
    },
    {
      name: 'Robert K.',
      role: 'Sales Director',
      initials: 'RK',
      text: 'Our team closed 5 deals in the first month using MailGen. The AI email generation saves us 10+ hours per week. Game changer for our sales process!'
    },
    {
      name: 'Emily T.',
      role: 'Marketing Manager',
      initials: 'ET',
      text: 'The response rates we are seeing are 3-4x higher than our previous email tool. The AI personalization actually works and prospects notice the difference.'
    },
    {
      name: 'James P.',
      role: 'Founder & CEO',
      initials: 'JP',
      text: 'MailGen helped us scale from 10 to 100 outbound emails per day without hiring more SDRs. The ROI is incredible - already paid for itself in week one.'
    },
    {
      name: 'Lisa M.',
      role: 'Head of Growth',
      initials: 'LM',
      text: 'Best email marketing platform I have ever used. The interface is intuitive, the AI is smart, and the results speak for themselves. Highly recommend!'
    },
    {
      name: 'Daniel W.',
      role: 'Enterprise Sales',
      initials: 'DW',
      text: 'We switched from our old platform to MailGen and saw immediate improvements. The prospect database is massive and the AI matching is incredibly accurate.'
    },
    {
      name: 'Rachel S.',
      role: 'VP Marketing',
      initials: 'RS',
      text: 'The analytics dashboard gives us insights we never had before. We can see exactly what is working and optimize our campaigns in real-time. Love it!'
    },
    {
      name: 'Kevin H.',
      role: 'Business Owner',
      initials: 'KH',
      text: 'I was skeptical about AI email tools but MailGen proved me wrong. The emails it generates are better than what I write myself. My response rate doubled!'
    },
    {
      name: 'Nicole F.',
      role: 'Sales Manager',
      initials: 'NF',
      text: 'The automated follow-ups are a lifesaver. I never miss a lead anymore and the timing is always perfect. This tool has made me a better salesperson.'
    },
    {
      name: 'Brandon G.',
      role: 'Marketing Consultant',
      initials: 'BG',
      text: 'I recommend MailGen to all my clients. The platform is reliable, the support is fantastic, and the results are consistently amazing. Five stars!'
    }
  ];

  // Duplicate testimonials for seamless loop
  const row1 = [...testimonials.slice(0, 8), ...testimonials.slice(0, 8)];
  const row2 = [...testimonials.slice(8), ...testimonials.slice(8)];

  return (
    <div className="py-20 overflow-hidden" style={{ backgroundColor: 'white' }}>
      <div className="max-w-7xl mx-auto px-12 mb-16">
        <div className="text-center mb-4">
          <h2 className="text-4xl font-semibold mb-4"
              style={{ color: 'rgba(0, 0, 0, 0.88)', fontWeight: 600 }}>
            Ready to Get Started
          </h2>
          <p className="text-lg"
             style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
            What our users are saying
          </p>
        </div>
      </div>

      {/* Row 1 - Scroll Left */}
      <div className="mb-6 relative">
        <style>{`
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .scroll-left {
            animation: scroll-left 20s linear infinite;
          }
          .scroll-left:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="flex gap-6 scroll-left">
          {row1.map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 rounded-xl p-6"
              style={{
                width: '400px',
                backgroundColor: 'white',
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                     style={{
                       backgroundColor: 'white',
                       border: '2px solid #f0f0f0',
                       color: 'rgba(0, 0, 0, 0.65)'
                     }}>
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-semibold"
                       style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    {testimonial.name}
                  </div>
                  <div className="text-sm"
                       style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
              <p className="leading-relaxed"
                 style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 - Scroll Right */}
      <div className="relative">
        <style>{`
          @keyframes scroll-right {
            0% {
              transform: translateX(-50%);
            }
            100% {
              transform: translateX(0);
            }
          }
          .scroll-right {
            animation: scroll-right 20s linear infinite;
          }
          .scroll-right:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="flex gap-6 scroll-right">
          {row2.map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 rounded-xl p-6"
              style={{
                width: '400px',
                backgroundColor: 'white',
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                     style={{
                       backgroundColor: 'white',
                       border: '2px solid #f0f0f0',
                       color: 'rgba(0, 0, 0, 0.65)'
                     }}>
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-semibold"
                       style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
                    {testimonial.name}
                  </div>
                  <div className="text-sm"
                       style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
              <p className="leading-relaxed"
                 style={{ color: 'rgba(0, 0, 0, 0.65)', fontSize: '15px', lineHeight: '1.7' }}>
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloatingTestimonials;
