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

// Post Type Definition
type Post = {
  _id: string;
  author: {
    username: string;
    profilePicture: string;
  };
  image: string[]; // Array of image URLs
  caption: string;
  likes: string[]; // List of likes (user IDs)
  comments: { userId: string; comment: string }[]; // List of comments
};

const HomeScreen = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string>('67444725f35c52da11856bac'); // Dummy user ID
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://192.168.1.2:8080/user/');
        if (Array.isArray(response.data)) setPosts(response.data);
        else throw new Error('Invalid response format.');
      } catch (err) {
        setError('Failed to fetch posts. Check your server or network.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const toggleLike = async (postId: string) => {
    try {
      const response = await axios.post(`http://192.168.1.2:8080/user/post/${postId}/like`, { userId });
      if (response.status === 200) {
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
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!currentPostId || newComment.trim() === '') return;
    try {
      const response = await axios.post(
        `http://192.168.1.2:8080/user/post/${currentPostId}/${userId}/comment`,
        { content: newComment }
      );
      if (response.status === 201) {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === currentPostId
              ? {
                  ...post,
                  comments: [...post.comments, { userId, comment: newComment }],
                }
              : post
          )
        );
        setNewComment('');
        setCurrentPostId(null);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.author.profilePicture }} style={styles.avatar} />
        <Text style={styles.username}>{item.author.username}</Text>
      </View>
      <Image source={{ uri: item.image[0] }} style={styles.postImage} />
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => toggleLike(item._id)}>
          <Ionicons
            name={item.likes.includes(userId) ? 'heart' : 'heart-outline'}
            size={24}
            style={[styles.actionIcon, item.likes.includes(userId) && styles.likedIcon]}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPostId(currentPostId === item._id ? null : item._id)}>
          <Ionicons name="chatbubble-outline" size={24} style={styles.actionIcon} />
        </TouchableOpacity>
      </View>
      <Text style={styles.likes}>{item.likes.length} likes</Text>
      <Text style={styles.caption}>
        <Text style={styles.username}>{item.author.username}</Text> {item.caption}
      </Text>
      {currentPostId === item._id && (
        <View style={styles.commentSection}>
          <FlatList
            data={item.comments}
            keyExtractor={(comment, index) => index.toString()}
            renderItem={({ item: comment }) => (
              <Text style={styles.commentText}>
                <Text style={styles.username}>{comment.userId}</Text> {comment.comment}
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

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  return <FlatList data={posts} renderItem={renderPost} keyExtractor={(post) => post._id} />;
};

const styles = StyleSheet.create({
  postContainer: { marginBottom: 20, padding: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  username: { marginLeft: 10, fontWeight: 'bold' },
  postImage: { width: '100%', height: 300, resizeMode: 'cover' },
  actions: { flexDirection: 'row', marginTop: 10 },
  actionIcon: { marginRight: 15 },
  likedIcon: { color: 'red' },
  likes: { fontWeight: 'bold', marginTop: 5 },
  caption: { marginTop: 5, fontSize: 16 },
  commentSection: { marginTop: 10 },
  commentText: { fontSize: 14, marginBottom: 5 },
  commentInput: { borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 5, marginBottom: 10 },
  loader: { marginTop: 20 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
});

export default HomeScreen;
