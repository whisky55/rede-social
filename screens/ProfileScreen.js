import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { signOut } from '../services/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import PostCard from '../components/PostCard';

const ProfileScreen = ({ navigation }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    let unsubscribePosts = null;

    const initializeProfile = async () => {
      await loadUserData();
      unsubscribePosts = loadUserPosts();
    };

    initializeProfile();

    // Cleanup function
    return () => {
      if (unsubscribePosts) {
        unsubscribePosts();
      }
    };
  }, []); // Removido navigation da dependência

  // Usar useFocusEffect do React Navigation seria melhor aqui
  useEffect(() => {
    const unsubscribeNavigation = navigation.addListener('focus', () => {
      // Apenas recarregar dados do usuário, não os posts (que já têm listener)
      loadUserData();
    });

    return unsubscribeNavigation;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          setUserData(firestoreData);
        } else {
          const authData = {
            name: user.displayName || '',
            email: user.email || '',
            phone: '',
            profileImage: null
          };
          setUserData(authData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const loadUserPosts = () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return null;
      }

      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('Posts atualizados no perfil:', snapshot.size); // Debug
          const posts = [];
          snapshot.forEach((doc) => {
            posts.push({
              id: doc.id,
              ...doc.data()
            });
          });
          setUserPosts(posts);
          setLoading(false);
        }, 
        (error) => {
          console.error('Erro ao carregar posts:', error);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Erro ao configurar listener:', error);
      setLoading(false);
      return null;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: performLogout }
      ]
    );
  };

  const performLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      Alert.alert('Erro', 'Não foi possível fazer logout');
    }
  };

  // Memoizar o renderPost para melhor performance
  const renderPost = useCallback(({ item }) => (
    <PostCard
      post={item}
      onLike={() => {}} // Se você quiser permitir curtir próprios posts, implemente aqui
      onUserPress={() => {}} // Não precisa navegar para próprio perfil
      currentUserId={auth.currentUser?.uid}
    />
  ), []);

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
      <Text style={styles.profileEmail}>{userData.email}</Text>
      {userData.phone && (
        <Text style={styles.profilePhone}>{userData.phone}</Text>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userPosts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.postsHeader}>
        <Text style={styles.postsHeaderText}>Meus Posts</Text>
      </View>
    </View>
  );

  const renderEmptyPosts = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Você ainda não fez nenhum post</Text>
      <TouchableOpacity
        style={styles.createFirstPostButton}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.createFirstPostButtonText}>Criar primeiro post</Text>
      </TouchableOpacity>
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
        // Adicionar estas props pode ajudar com performance
        removeClippedSubviews={false}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={100}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#666',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  profilePhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  postsHeader: {
    marginTop: 10,
  },
  postsHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstPostButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstPostButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
});

export default ProfileScreen;