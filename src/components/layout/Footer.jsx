import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { B2B_CONFIG } from '../../utils/helpers';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-espresso text-ivory/70 pt-16 lg:pt-20 pb-8 font-sans relative">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-0 mb-1">
              <img
                src="/brand-icon.png"
                alt="Zycoon Icon"
                className="h-12 w-auto object-contain"
              />
              <img
                src="/zycoon-logo-white.png"
                alt="Zycoon"
                className="h-20 w-auto object-contain opacity-90 -ml-1"
              />
            </Link>
            <p className="text-[10px] text-ivory/50 font-sans tracking-[0.2em] uppercase mb-4 pl-8">Bags and Backpacks</p>
            <p className="text-xs text-ivory/40 leading-relaxed mb-6">
              Manufacturer & Supplier of Bags and Backpacks for Wholesale, OEM & Private Label.
            </p>
            <div className="space-y-3 text-[11px] text-ivory/60">
              <div className="flex items-start">
                <MapPin className="w-3.5 h-3.5 mr-2.5 mt-0.5 flex-shrink-0 text-gold/40" strokeWidth={1.5} />
                <span>{B2B_CONFIG.factoryLocation}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-2.5 flex-shrink-0 text-gold/40" strokeWidth={1.5} />
                <a href={`mailto:${B2B_CONFIG.businessEmail}`} className="hover:text-ivory transition-colors">
                  {B2B_CONFIG.businessEmail}
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-2.5 flex-shrink-0 text-gold/40" strokeWidth={1.5} />
                <span>{B2B_CONFIG.whatsappNumber}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-ivory/40 mb-5">Navigation</h4>
            <ul className="space-y-3">
              {[
                { name: 'Collection', path: '/products' },
                { name: 'Lookbook', path: '/lookbook' },
                { name: 'Custom Manufacturing', path: '/custom-manufacturing' },
                { name: 'Import & Sourcing', path: '/import-sourcing' },
                { name: 'About', path: '/about' },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-xs text-ivory/50 hover:text-ivory transition-colors duration-300 flex items-center group">
                    <span className="w-0 group-hover:w-3 h-px bg-gold/30 mr-0 group-hover:mr-2 transition-all duration-300" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-ivory/40 mb-5">Compliance</h4>
            <ul className="space-y-3 text-xs text-ivory/50">
              <li>EU REACH Compliant</li>
              <li>ISO 9001:2015</li>
              <li>Sedex SMETA Certified</li>
              <li>LWG Gold Tanneries</li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-ivory/40 mb-5">Get in Touch</h4>
            <p className="text-xs text-ivory/40 leading-relaxed mb-5">
              Access our complete B2B product catalog and wholesale pricing.
            </p>
            <Link to="/contact" className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.15em] font-medium text-gold/70 hover:text-gold transition-colors duration-300 group">
              <span>B2B Inquiry</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Factory Map */}
        <div className="mb-12">
          <h4 className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-ivory/40 mb-4">Factory Location</h4>
          <div className="border border-ivory/10 overflow-hidden">
            <iframe
              title="Zycoon Factory Location"
              src={`https://www.google.com/maps?q=${encodeURIComponent(B2B_CONFIG.factoryMapPin)}&output=embed`}
              width="100%"
              height="260"
              style={{ border: 0, filter: 'grayscale(0.6) invert(0.9) contrast(0.85)' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-ivory/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-ivory/30">
          <div>&copy; {currentYear} {B2B_CONFIG.brandName}. All Rights Reserved.</div>
          <div className="flex items-center space-x-4 font-mono">
            <span>RFQ Only — No Direct Checkout</span>
            <span className="text-ivory/10">|</span>
            <span>{B2B_CONFIG.whatsappNumber}</span>
          </div>
        </div>

        {/* Credit */}
        <div className="text-center mt-6 pt-4 border-t border-ivory/5">
          <p className="text-[9px] text-ivory/20 font-mono tracking-wider">
            Designed and Developed by{' '}
            <a href="https://westmere.io" target="_blank" rel="noopener noreferrer" className="text-ivory/40 hover:text-gold/70 transition-colors underline underline-offset-2 decoration-ivory/10 hover:decoration-gold/30">
              Westmere
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
export { Footer };
