// Central business configuration constants
export const B2B_CONFIG = {
  brandName: 'Zycoon',
  brandShortName: 'Zycoon',
  tagline: 'Bags & Backpacks',
  factoryLocation: 'Shop 2-3, Ground Floor, Mohamedi Manzil, YMCA Road, Agripada, Mumbai Central, Mumbai, Maharashtra 400008',
  factoryMapPin: 'Zycoon Backpack Bag', // Google Maps pinpoint used by the footer map embed
  yearsInBusiness: '19',
  productionCapacity: '15,000+',
  countriesExported: '35+',
  moqMinimum: 100,
  whatsappNumber: '+91 91365 42289',
  whatsappRaw: '919136542289', // Raw numbers only for api.whatsapp.com
  businessEmail: 'zycoonbags@gmail.com',
  instagramUrl: '', // TODO: fill Instagram profile URL later — float button uses this
  businessHours: 'Mon — Sat: 10:00 AM — 8:00 PM',
  certifications: 'ISO 9001:2015, REACH Compliance, LWG Gold Rated, Sedex Certified'
};

// Format currency
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Generate prefilled WhatsApp URL for a quote request
export const buildWhatsAppRFQUrl = (companyName, country, cartItems) => {
  const itemsText = cartItems
    .map((item) => `- ${item.product_name} (${item.selected_color}) | Qty: ${item.quantity} (MOQ: ${item.moq})`)
    .join('\n');

  const text = `Hello Zycoon Team,\n\nI would like to request a wholesale price quote for the following items:\n\n${itemsText}\n\nCompany Name: ${companyName}\nCountry: ${country}\n\nPlease get back to us with the pricing and shipping timeline.\n\nThank you!`;
  
  return `https://api.whatsapp.com/send?phone=${B2B_CONFIG.whatsappRaw}&text=${encodeURIComponent(text)}`;
};

// Generate prefilled WhatsApp URL for generic contact
export const buildWhatsAppContactUrl = () => {
  const text = `Hello Zycoon Team, we are interested in your B2B wholesale catalog and custom manufacturing capabilities. Can you connect us with a sales representative?`;
  return `https://api.whatsapp.com/send?phone=${B2B_CONFIG.whatsappRaw}&text=${encodeURIComponent(text)}`;
};
