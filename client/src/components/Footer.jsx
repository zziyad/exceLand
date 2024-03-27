import { Footer } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { BsFacebook, BsInstagram, BsTwitter } from 'react-icons/bs';

export default function FooterCom() {
  return (
    <Footer container className="">
      <div className="w-full max-w-7xl mx-auto">
        <div className="w-full sm:flex sm:items-center sm:justify-between">
          <Footer.Copyright
            href="#"
            by="ExeLand blog"
            year={new Date().getFullYear()}
          />
          <div className="flex gap-6 sm:mt-0 mt-4 sm:justify-center">
            <Footer.LinkGroup>
              <Footer.Link href="#">Privacy Policy</Footer.Link>
              <Footer.Link href="#">Terms &amp; Conditions</Footer.Link>
            </Footer.LinkGroup>
          </div>

          <div className="flex gap-6 sm:mt-0 mt-4 sm:justify-center">
            <Footer.Icon
              href="https://www.facebook.com/exceland.az/"
              icon={BsFacebook}
            />
            <Footer.Icon
              href="https://www.instagram.com/exceland.az/"
              icon={BsInstagram}
            />
          </div>
        </div>
      </div>
    </Footer>
  );
}
