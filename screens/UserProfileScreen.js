import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import PostCard from '../components/PostCard';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const [userPosts, setUserPosts] = useState([]);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: userName || 'Perfil do Usuário',
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#333',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });

    loadUserData();
    const unsubscribe = loadUserPosts();
    return () => unsubscribe && unsubscribe();
  }, [userId, userName]);

  const loadUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        // Se não tem dados no Firestore, usar apenas o nome que veio por parâmetro
        setUserData({
          name: userName || 'Usuário',
          email: '',
          phone: '',
          profileImage: null
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setUserData({
        name: userName || 'Usuário',
        email: '',
        phone: '',
        profileImage: null
      });
    }
  };

  const loadUserPosts = () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const posts = [];
        snapshot.forEach((doc) => {
          posts.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setUserPosts(posts);
        setLoading(false);
      }, (error) => {
        console.error('Erro ao carregar posts:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener:', error);
      setLoading(false);
    }
  };

  const handleLike = async (postId, currentLikes) => {
    // Implementar lógica de like (igual ao HomeScreen)
    try {
      const currentUserId = auth.currentUser.uid;
      const postRef = doc(db, 'posts', postId);
      
      const isLiked = currentLikes.includes(currentUserId);
      
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUserId)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUserId)
        });
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      Alert.alert('Erro', 'Não foi possível curtir o post');
    }
  };

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onLike={() => handleLike(item.id, item.likes || [])}
      onUserPress={() => {}} // Não precisa navegar pois já está no perfil
      currentUserId={auth.currentUser.uid}
    />
  );

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.profileImageContainer}>
        {userData.profileImage ? (
          <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImageText}>
              {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.profileName}>{userData.name || 'Nome não informado'}</Text>
      {userData.email && (
        <Text style={styles.profileEmail}>{userData.email}</Text>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userPosts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>

      <View style={styles.postsHeader}>
        <Text style={styles.postsHeaderText}>Posts de {userData.name}</Text>
      </View>
    </View>
  );

  const renderEmptyPosts = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {userData.name} ainda não fez nenhum post
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyPosts}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={userPosts.length === 0 ? styles.emptyListContainer : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  postsHeader: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
  },
  postsHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default UserProfileScreen;