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

export default function InstagramProfile() {
  const [profileData, setProfileData] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(
          `http://192.168.1.2:8080/user/67444725f35c52da11856bac`
        );
        const data = await response.json();
        console.log('Profile Data:', data); // Debug log
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
    getPosts('67444725f35c52da11856bac');
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
        `http://192.168.1.2:8080/user/edit-profile/67444725f35c52da11856bac`,
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
  },
  bio: {
    fontSize: 14,
    color: '#444',
  },
  editButton: {
    alignSelf: 'center',
    marginVertical: 16,
    paddingHorizontal: 32,
    paddingVertical: 8,
    backgroundColor: '#3897f0',
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    alignSelf: 'center',
    marginVertical: 16,
    paddingHorizontal: 32,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  postContainer: {
    width: '31%',
    marginBottom: 8,
    borderRadius: 4,
  },
  postThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 4,
  },
  postTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: '#333',
  },
});
