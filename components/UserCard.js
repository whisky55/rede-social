import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

const UserCard = ({ user, onPress, showFollowButton = false, currentUserFollowing = [] }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [isFollowing, setIsFollowing] = useState(
    currentUserFollowing.includes(user.id)
  );
  const [isLoading, setIsLoading] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFollow = async () => {
    if (!currentUser || currentUser.uid === user.id) return;

    setIsLoading(true);
    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef = doc(db, 'users', user.id);

      if (isFollowing) {
        // Deixar de seguir
        await Promise.all([
          updateDoc(currentUserRef, {
            following: arrayRemove(user.id)
          }),
          updateDoc(targetUserRef, {
            followers: arrayRemove(currentUser.uid)
          })
        ]);
        setIsFollowing(false);
      } else {
        // Seguir
        await Promise.all([
          updateDoc(currentUserRef, {
            following: arrayUnion(user.id)
          }),
          updateDoc(targetUserRef, {
            followers: arrayUnion(currentUser.uid)
          })
        ]);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Erro ao seguir/deixar de seguir:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o status de seguimento.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFollowersCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count?.toString() || '0';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {getInitials(user.displayName || user.name)}
              </Text>
            </View>
          )}
          
          {/* Indicador online (opcional) */}
          {user.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        {/* Informações do usuário */}
        <View style={styles.userInfo}>
          <Text style={styles.displayName} numberOfLines={1}>
            {user.displayName || user.name || 'Usuário'}
          </Text>
          
          {user.username && (
            <Text style={styles.username} numberOfLines={1}>
              @{user.username}
            </Text>
          )}
          
          {user.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
          
          {/* Estatísticas */}
          <View style={styles.statsContainer}>
            {user.followers && (
              <View style={styles.statItem}>
                <Ionicons name="people" size={12} color="#666" />
                <Text style={styles.statText}>
                  {formatFollowersCount(user.followers.length)} seguidores
                </Text>
              </View>
            )}
            
            {user.postsCount !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="grid" size={12} color="#666" />
                <Text style={styles.statText}>
                  {user.postsCount} posts
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Botão de seguir */}
      {showFollowButton && currentUser && currentUser.uid !== user.id && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton
          ]}
          onPress={handleFollow}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={isFollowing ? "#007AFF" : "white"} />
          ) : (
            <>
              <Ionicons
                name={isFollowing ? "checkmark" : "person-add"}
                size={16}
                color={isFollowing ? "#007AFF" : "white"}
              />
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Indicador de seta para navegação */}
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  followingButtonText: {
    color: '#007AFF',
  },
});

export default UserCard;