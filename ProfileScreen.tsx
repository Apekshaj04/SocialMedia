import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';

interface Author {
  _id: string;
  name: string;
}

interface Post {
  author: Author;
  title: string;
  caption: string;
  image: string;
}

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  const [newPost, setNewPost] = useState({
    title: '',
    caption: '',
    image: '',
  });

  // Replace with the logged-in user's ID for filtering their posts
  const userId = '67444725f35c52da11856bac';

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(
          `http://192.168.1.2:8080/user/${userId}`
        );
        const data = await response.json();
        // console.log('Profile Data:', data); // Debug log
        if (data) {
          setProfileData(data);
          setBio(data.bio || '');
          setProfilePicture(data.profilePicture || '');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    const getPosts = async (userId: string) => {
      try {
        const response = await fetch('http://192.168.1.2:8080/user/'); // Adjust URL to your posts endpoint
        const postData = await response.json();
        console.log('Posts Data:', postData); // Debug log
        const filteredPosts = postData.filter(
          (post: Post) => post.author._id === userId
        );
        setPosts(filteredPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };
    fetchProfileData();
    getPosts("67444725f35c52da11856bac");
  }, []);

  const toggleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const saveProfileChanges = async () => {
    try {
      const updatedProfile = {
        bio: bio,
        profilePicture: profilePicture,
      };

      const response = await fetch(
        `http://192.168.1.2:8080/user/edit-profile/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProfile),
        }
      );

      const updatedData = await response.json();

      if (updatedData) {
        setProfileData(updatedData);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile changes:', error);
    }
  };

  const handlePostSubmit = async () => {
    const postData = {
      title: newPost.title,
      caption: newPost.caption,
      image: newPost.image,
      author: { _id: userId }, // Set your user ID
    };

    try {
      const response = await fetch('http://192.168.1.2:8080/user/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const createdPost = await response.json();

      if (createdPost) {
        setPosts([createdPost, ...posts]); // Add new post at the top
        setNewPost({ title: '', caption: '', image: '' }); // Clear inputs
      }
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  if (!profileData) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image
            source={
              profilePicture && typeof profilePicture === 'string'
                ? { uri: profilePicture }
                : { uri: 'https://media.newyorker.com/photos/61e87281b67066a13fd20ea8/master/w_1920,c_limit/Caesar-Ronaldo.jpg' }
            }
            style={styles.profileImage}
          />
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {profileData.followers?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {profileData.following?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioContainer}>
          {isEditing ? (
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={styles.bioInput}
              placeholder="Enter your bio"
            />
          ) : (
            <Text style={styles.bio}>{bio}</Text>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={toggleEditProfile}>
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>

        {/* Save Button when editing */}
        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={saveProfileChanges}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        {/* Add Post Section */}
        <View style={styles.addPostContainer}>
          <TextInput
            style={styles.input}
            placeholder="Post Title"
            value={newPost.title}
            onChangeText={(text) => setNewPost({ ...newPost, title: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Post Caption"
            value={newPost.caption}
            onChangeText={(text) => setNewPost({ ...newPost, caption: text })}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Image URL "
            value={newPost.image}
            onChangeText={(text) => setNewPost({ ...newPost, image: text })}
          />
          <TouchableOpacity style={styles.postButton} onPress={handlePostSubmit}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        <View style={styles.postsContainer}>
          {posts.map((post, index) => (
            <View key={index} style={styles.postContainer}>
              <Image
                source={
                  post.image && typeof post.image === 'string'
                    ? { uri: post.image }
                    : { uri: 'https://default-placeholder-image-url.com' }
                }
                style={styles.postThumbnail}
              />
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postCaption}>
                {post.caption}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  bioContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bioInput: {
    fontSize: 14,
    color: '#444',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
  },
  bio: {
    fontSize: 14,
    color: '#444',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    padding: 8,
    backgroundColor: '#28A745',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addPostContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 8,
    fontSize: 14,
    paddingVertical: 8,
  },
  postButton: {
    padding: 12,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  postsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  postContainer: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  postThumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#ddd',
  },
  postTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postCaption: {
    fontSize: 14,
    color: '#444',
  },
});
