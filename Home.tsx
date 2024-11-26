import React, { useEffect, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Button,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

type Post = {
  _id: string;
  author: {
    username: string;
    profilePicture: string;
  };
  image: string[];  // Array of image URLs
  caption: string;
  likes: string[];
  comments: { userId: string; comment: string }[];  // List of comments
};

const InstagramHome = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string>('');  // Replace with actual auth logic
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');  // State for new comment
  const [currentPostId, setCurrentPostId] = useState<string>('');  // State for the post being commented on

  // Fetch posts from the backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://192.168.1.2:8080/user/');
        console.log('Fetched posts:', response.data);
        if (Array.isArray(response.data)) {
          setPosts(response.data);
        } else {
          console.error('Response is not an array:', response.data);
          setError('Failed to fetch posts. Invalid response format.');
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to fetch posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const toggleLike = async (postId: string) => {
    try {
      await axios.post(`http://192.168.1.2:8080/user/${postId}/like`, { userId });
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: post.likes.includes(userId)
                  ? post.likes.filter((id) => id !== userId)
                  : [...post.likes, userId],
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleCommentIconPress = (postId: string) => {
    setCurrentPostId(postId);  // Set the current post ID for which the user is commenting
  };

  const handleCommentSubmit = async () => {
    if (newComment.trim() === '') return;

    try {
      // Post the comment to the backend
      await axios.post(`http://192.168.1.2:8080/user/post/${currentPostId}/comment`, { userId, comment: newComment });

      // Update the local state to reflect the new comment
      setPosts((prev) =>
        prev.map((post) =>
          post._id === currentPostId
            ? { ...post, comments: [...post.comments, { userId, comment: newComment }] }
            : post
        )
      );

      // Reset the input field and close the comment input view
      setNewComment('');
      setCurrentPostId('');
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.author.profilePicture }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{item.author.username}</Text>
      </View>

      {/* Post Image */}
      <Image
        source={{ uri: item.image[0] }}  // Assuming there's at least one image
        style={styles.postImage}
      />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => toggleLike(item._id)}>
          <Ionicons
            name={item.likes.includes(userId) ? 'heart' : 'heart-outline'}
            size={24}
            style={[
              styles.actionIcon,
              item.likes.includes(userId) && styles.likedIcon,
            ]}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleCommentIconPress(item._id)}>
          <Ionicons name="chatbubble-outline" size={24} style={styles.actionIcon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} style={styles.actionIcon} />
        </TouchableOpacity>
      </View>

      {/* Post Metadata */}
      <Text style={styles.likes}>{item.likes.length} likes</Text>
      <Text style={styles.caption}>
        <Text style={styles.username}>{item.author.username} </Text>
        {item.caption}
      </Text>

      {/* Display Comments */}
      {item._id === currentPostId && (
        <View style={styles.commentSection}>
          <FlatList
            data={item.comments}
            keyExtractor={(comment, index) => index.toString()}
            renderItem={({ item: comment }) => (
              <Text style={styles.commentText}>
                <Text style={styles.username}>{comment.userId} </Text>
                {comment.comment}
              </Text>
            )}
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={newComment}
            onChangeText={setNewComment}
          />
          <Button title="Post" onPress={handleCommentSubmit} />
        </View>
      )}
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}  // Use the posts array fetched from the backend
      keyExtractor={(item) => item._id}
      renderItem={renderPost}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#fafafa',
    paddingBottom: 10,
  },
  postContainer: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,  // For shadow effect on Android
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#262626',
  },
  postImage: {
    width: '100%',
    height: 400,
  },
  actions: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-between',
  },
  actionIcon: {
    marginRight: 15,
    color: '#262626',
  },
  likedIcon: {
    color: '#ed4956', // Instagram like color (Red)
  },
  likes: {
    fontWeight: 'bold',
    marginLeft: 10,
    marginTop: 5,
    color: '#262626',
  },
  caption: {
    marginLeft: 10,
    marginTop: 5,
    marginBottom: 10,
    color: '#262626',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  commentSection: {
    paddingHorizontal: 10,
  },
  commentText: {
    marginTop: 5,
    color: '#262626',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
});

export default InstagramHome;
