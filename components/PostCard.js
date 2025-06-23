import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function PostCard({ post, currentUserId, onUserPress }) {
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUserId) || false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async () => {
    try {
      const postRef = doc(db, 'posts', post.id);
      
      if (isLiked) {
        // Remover like
        await updateDoc(postRef, {
          likes: arrayRemove(currentUserId)
        });
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Adicionar like
        await updateDoc(postRef, {
          likes: arrayUnion(currentUserId)
        });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      Alert.alert('Erro', 'Não foi possível curtir o post');
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este post?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: deletePost }
      ]
    );
  };

  const deletePost = async () => {
    try {
      // Deletar imagem do armazenamento local se existir
      if (post.imageUri) {
        const fileExists = await FileSystem.getInfoAsync(post.imageUri);
        if (fileExists.exists) {
          await FileSystem.deleteAsync(post.imageUri);
        }
      }

      // Deletar post do Firestore
      await deleteDoc(doc(db, 'posts', post.id));
      Alert.alert('Sucesso', 'Post excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      Alert.alert('Erro', 'Não foi possível excluir o post');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header do Post */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => onUserPress(post.userId, post.userName)}
        >
          <View style={styles.avatar}>
            {post.userPhoto ? (
              <Image source={{ uri: post.userPhoto }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={24} color="#666" />
            )}
          </View>
          <View>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.postDate}>{formatDate(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {/* Botão de deletar se for o próprio usuário */}
        {post.userId === currentUserId && (
          <TouchableOpacity onPress={handleDeletePost} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Imagem do Post */}
      {post.imageUri && (
        <Image source={{ uri: post.imageUri }} style={styles.postImage} />
      )}

      {/* Descrição */}
      {post.description && (
        <Text style={styles.description}>{post.description}</Text>
      )}

      {/* Localização */}
      {post.location && (
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText}>{post.location}</Text>
        </View>
      )}

      {/* Footer - Likes */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#ff4444" : "#666"} 
          />
        </TouchableOpacity>
        <Text style={styles.likesText}>
          {likesCount} {likesCount === 1 ? 'curtida' : 'curtidas'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  postImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  description: {
    fontSize: 16,
    color: '#333',
    padding: 15,
    paddingBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
  },
  likeButton: {
    marginRight: 10,
  },
  likesText: {
    fontSize: 14,
    color: '#666',
  },
});