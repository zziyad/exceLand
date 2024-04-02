import { Avatar, Button, Navbar, Dropdown } from 'flowbite-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { signoutSuccess } from '../redux/user/userSlice';
import { toggleTheme } from '../redux/theme/themeSlice';
import { useAsyncFn } from '../hooks/useAsync';
import { signout } from '../services/user.jsx';

export default function Header() {
  const path = useLocation().pathname;
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  const signOutUserFn = useAsyncFn(signout);
  const navigate = useNavigate();
  const onSingout = () => {
    return signOutUserFn
      .execute()
      .then(() => {
        dispatch(signoutSuccess());
        navigate('/nenya');
      })
      .catch(console.log);
  };
  const handleSignout = async () => {
    onSingout();
  };

  return (
    <Navbar className="border-b-2">
      <Link
        to="/"
        className="self-center whitespace-nowrap relative text-sm sm:text-xl font-semibold dark:text-white"
      >
        <img className="h-12" src="./Exl.png" alt="logo" />
      </Link>

      <div className="flex gap-2 md:order-2">
        <Button
          className="w-12 h-10 sm:inline"
          color="gray"
          pill
          onClick={() => dispatch(toggleTheme())}
        >
          {theme === 'light' ? <FaSun /> : <FaMoon />}
        </Button>
        {currentUser ? (
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar alt="user" img={currentUser.profile_picture} rounded />
            }
          >
            <Dropdown.Header>
              <span className="block text-sm">{currentUser.username}</span>
            </Dropdown.Header>
            <Link to={'/dashboard?tab=dash'}>
              <Dropdown.Item>Dashboard</Dropdown.Item>
            </Link>
            {currentUser.is_admin ? (
              <Link to={'/create-post'}>
                <Dropdown.Item>Create Post</Dropdown.Item>
              </Link>
            ) : (
              <></>
            )}
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleSignout}>Sign out</Dropdown.Item>
          </Dropdown>
        ) : (
          <></>

          /*
          <Link to="/sign-in">
            <Button gradientDuoTone="purpleToBlue" outline>
              Sign In
            </Button>
          </Link>
              */
        )}
        <Navbar.Toggle />
      </div>

      <Navbar.Collapse>
        <Navbar.Link active={path === '/'} as={'div'}>
          <Link to="/">Ana Səifə</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/about'} as={'div'}>
          <Link to="/about">Haqqımızda</Link>
        </Navbar.Link>

        <Navbar.Link active={path === '/blog'} as={'div'}>
          <Link to="/blog">Blog</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/contact'} as={'div'}>
          <Link to="/contact">Əlaqə</Link>
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}
