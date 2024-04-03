import { Table } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAsyncFn } from '../hooks/useAsync';
import { getPosts } from '../services/post.jsx';

export default function DashPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const [userPosts, setUserPosts] = useState([]);
  const [showMore, setShowMore] = useState(true);
  const getPostsFn = useAsyncFn(getPosts);

  useEffect(() => {
    const onGetPosts = () => {
      return getPostsFn
        .execute({ userId: currentUser.id })
        .then((data) => {
          setUserPosts(data);
          if (data.length < 9) setShowMore(false);
        })
        .catch((error) => {
          console.log({ error });
        });
    };

    if (currentUser.is_admin) {
      onGetPosts();
    }
  }, [currentUser.id]);

  const handleShowMore = async () => {
    const startIndex = userPosts.length;
    return getPostsFn
      .execute({ userId: currentUser.id, startIndex })
      .then((data) => {
        setUserPosts((prev) => [...prev, ...data]);
        if (data.length < 9) setShowMore(false);
      })
      .catch((error) => {
        console.log({ error });
      });
  };

  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      {currentUser.is_admin && userPosts.length > 0 ? (
        <>
          <Table hoverable className="shadow-md">
            <Table.Head>
              <Table.HeadCell>Date updated</Table.HeadCell>
              <Table.HeadCell>Post image</Table.HeadCell>
              <Table.HeadCell>Post title</Table.HeadCell>
              <Table.HeadCell>Category</Table.HeadCell>
              <Table.HeadCell>Delete</Table.HeadCell>
              <Table.HeadCell>
                <span>Edit</span>
              </Table.HeadCell>
            </Table.Head>
            {userPosts.map((post) => (
              <Table.Body key={post.post_id} className="divide-y">
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell>
                    {new Date(post.post_updated_at).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`/post/${post.post_slug}`}>
                      <img
                        src={post.post_image}
                        alt={post.post_title}
                        className="w-20 h-10 object-cover bg-gray-500"
                      />
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Link
                      className="font-medium text-gray-900 dark:text-white"
                      to={`/post/${post.post_slug}`}
                    >
                      {post.post_title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{post.post_category}</Table.Cell>
                  <Table.Cell>
                    <span className="font-medium text-red-500 hover:underline cursor-pointer">
                      Delete
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Link
                      className="text-teal-500 hover:underline"
                      to={`/update-post/${post.post_id}`}
                    >
                      <span>Edit</span>
                    </Link>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            ))}
          </Table>
          {showMore && (
            <button
              onClick={handleShowMore}
              className="w-full text-teal-500 self-center text-sm py-7"
            >
              Show more
            </button>
          )}
        </>
      ) : (
        <p>You have no posts yet!</p>
      )}
    </div>
  );
}
