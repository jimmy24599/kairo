import React from 'react';

const ContactForm: React.FC = () => {
  return (
    <form>
      <input type='text' placeholder='Name' />
      <input type='email' placeholder='Email' />
      <textarea placeholder='Message'></textarea>
      <button type='submit'>Submit</button>
    </form>
  );
};

export default ContactForm;