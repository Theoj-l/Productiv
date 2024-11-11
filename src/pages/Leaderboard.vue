<!-- LATEST UPDATE FOR LEADERBOARD, SENT AT 9AM -->
<script setup>
import { h, ref, computed, onMounted, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FlexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, useVueTable } from '@tanstack/vue-table';
import { db } from '@/main'; // Firestore instance from main.js
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAuth } from 'firebase/auth';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';
import { getStorage, ref as firebaseRef, getDownloadURL } from 'firebase/storage';
import { useUserStore } from '@/stores/UserObjStore'; // Adjust this path as necessary
import AddFriend from '@/components/ProfilePageComp/AddFriend.vue';
import { Skeleton } from '@/components/ui/skeleton';

const globalData = ref([]);
const friendsData = ref([]);
const userStore = useUserStore(); // Initialize the store
const currentUsername = computed(() => {
  return userStore.username; // Get username directly from store
});

// Fetch profile picture URL from Firebase Storage
const fetchProfilePictureUrl = async (uid) => {
  const storage = getStorage();
  const profilePicRef = firebaseRef(storage, `profile-pictures/${uid}/profile.jpg`);
  try {
    const url = await getDownloadURL(profilePicRef);
    return url;
  } catch (error) {
    console.error("Error fetching profile picture URL for UID:", uid, error);
    return null; // Return null if the image is not found
  }
};

// Fetch leaderboard data from Firestore and populate globalData
async function fetchLeaderboardData() {
  isLoadingGlobal.value = true;
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    const leaderboardEntries = [];

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const uid = doc.id;
      const profilePicUrl = await fetchProfilePictureUrl(uid);

      const score = userData.tag_time_obj ? calculateTotalScore(userData.tag_time_obj) : 0;
      leaderboardEntries.push({
        id: uid,
        score,
        rank: 0,
        username: userData.username || 'Unknown',
        profilePicUrl: profilePicUrl
      });
    }

    leaderboardEntries
      .sort((a, b) => b.score - a.score)
      .forEach((entry, index) => {
        entry.rank = index + 1;
      });

    globalData.value = leaderboardEntries;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
  } finally {
    isLoadingGlobal.value = false;
  }
}

// Helper function to calculate total score from tag_time_obj
function calculateTotalScore(tagTimeObj) {
  let totalScore = 0;
  for (const date in tagTimeObj) {
    const dailyScores = tagTimeObj[date];
    for (const tag in dailyScores) {
      totalScore += dailyScores[tag];
    }
  }
  return totalScore;
}

// Fetch following data from Firestore based on the friends array in the current user's document
async function fetchFriendsData() {
  isLoadingFriends.value = true;
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const currentUserDocRef = doc(db, 'users', user.uid);
    const currentUserDoc = await getDoc(currentUserDocRef);
    const friendsList = currentUserDoc.data()?.friends || [];

    const friendsEntries = [];

    // Retrieve data for each friend UID directly
    for (const friendUid of friendsList) {
      const friendDocRef = doc(db, 'users', friendUid);
      const friendDoc = await getDoc(friendDocRef);
      
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        const profilePicUrl = await fetchProfilePictureUrl(friendUid);
        const score = friendData.tag_time_obj ? calculateTotalScore(friendData.tag_time_obj) : 0;

        friendsEntries.push({
          id: friendUid,
          score,
          rank: 0,
          username: friendData.username || 'Unknown',
          profilePicUrl: profilePicUrl,
        });
      }
    }

    // Add current user to friends list if not already present
    const currentUserData = currentUserDoc.data();
    if (currentUserData) {
      const score = currentUserData.tag_time_obj ? calculateTotalScore(currentUserData.tag_time_obj) : 0;
      const profilePicUrl = await fetchProfilePictureUrl(user.uid);
      friendsEntries.push({
        id: user.uid,
        score,
        rank: 0,
        username: currentUserData.username || 'Unknown',
        profilePicUrl: profilePicUrl,
      });
    }

    // Sort by score and assign ranks
    friendsEntries
      .sort((a, b) => b.score - a.score)
      .forEach((entry, index) => {
        entry.rank = index + 1;
      });

    friendsData.value = friendsEntries;
  } catch (error) {
    console.error('Error fetching friends data:', error);
  } finally {
    isLoadingFriends.value = false;
  }
}

onMounted(async () => {
  isLoadingGlobal.value = true;
  isLoadingFriends.value = true;
  
  try {
    await userStore.init();
    await Promise.all([
      fetchLeaderboardData(),
      fetchFriendsData()
    ]);
  } catch (error) {
    console.error('Error in onMounted:', error);
  } finally {
    isLoadingGlobal.value = false;
    isLoadingFriends.value = false;
  }
});

// Column configuration for the leaderboard
const columns = [
  {
    accessorKey: 'rank',
    header: () => h('div', { class: 'text-center' }, 'Rank'),
    cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.getValue('rank')),
  },
  {
    accessorKey: 'username',
    header: 'User',
    cell: ({ row }) => {
      const rowUsername = row.getValue('username');
      const storeUsername = userStore.username;
      
      const isCurrentUser = rowUsername === storeUsername;
      const displayText = isCurrentUser ? `${rowUsername} (you)` : rowUsername;

      return h('div', { 
        class: 'flex items-center max-w-full',
        'data-is-current': isCurrentUser
      }, [
        h('img', {
          src: row.original.profilePicUrl || '',
          alt: 'Profile Picture',
          style: 'width: 36px; height: 36px; object-fit: hidden; border-radius: 50%; margin-right: 10px'
        }),
        h('span', null, displayText)
      ]);
    },
  },
  {
    accessorKey: 'score',
    header: () => h('div', { class: 'text-center' }, 'Exp'),
    cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.getValue('score').toLocaleString()),
  },
];

// Table configuration for global leaderboard
const globalTable = useVueTable({
  data: computed(() => globalData.value),
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});

// Table configuration for friends leaderboard
const friendsTable = useVueTable({
  data: computed(() => friendsData.value),
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});

// Selected leaderboard state
const selectedLeaderboard = ref('global');

// Computed property for the selected table
const selectedTable = computed(() => {
  return selectedLeaderboard.value === 'global' ? globalTable : friendsTable;
});

// Add this after your table configurations
watch(globalData, (newData) => {
}, { deep: true });

// Add this ref for the AddFriend dialog
const isAddFriendOpen = ref(false);

// Add these refs near the top with other refs
const isLoadingGlobal = ref(true);
const isLoadingFriends = ref(true);
const skeletonRows = computed(() => Array(10).fill(null));
</script>

<template>
    <div class="hidden md:flex w-full h-full">
      <div class="grid grid-cols-2 gap-4 w-full mx-auto p-4">
          <!-- Global Leaderboard Card -->
          <Card class="h-[calc(100dvh-100px)]">
            <CardHeader class="pb-4">
              <CardTitle class="header-style">Global Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="rounded-md border h-full">
                <!-- <Table class="table-auto w-full">
                  <TableHeader>
                    <TableRow v-for="headerGroup in globalTable.getHeaderGroups()" :key="headerGroup.id">
                      <TableHead v-for="header in headerGroup.headers" :key="header.id">
                        <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table> -->
                <ScrollArea class="h-[calc(100dvh-220px)]">
                <Table class="table-auto w-full">
                  <TableHeader>
                    <TableRow v-for="headerGroup in globalTable.getHeaderGroups()" :key="headerGroup.id">
                      <TableHead v-for="header in headerGroup.headers" :key="header.id">
                        <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <template v-if="isLoadingGlobal">
                      <TableRow v-for="i in skeletonRows" :key="'skeleton-' + i">
                        <TableCell>
                          <Skeleton class="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <div class="flex items-center gap-2">
                            <Skeleton class="h-9 w-9 rounded-full" />
                            <Skeleton class="h-4 w-[150px]" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div class="flex justify-center">
                            <Skeleton class="h-4 w-12" />
                          </div>
                        </TableCell>
                      </TableRow>
                    </template>
                    <template v-else-if="globalTable.getRowModel().rows?.length">
                      <template v-for="row in globalTable.getRowModel().rows" :key="row.id">
                        <TableRow>
                          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                            <FlexRender
                              :render="cell.column.columnDef.cell"
                              :props="cell.getContext()"
                            />
                          </TableCell>
                        </TableRow>
                      </template>
                    </template>

                    <TableRow v-else>
                      <TableCell :colspan="columns.length" class="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <!-- Friends Leaderboard Card -->
          <Card class="h-[calc(100dvh-100px)]">
            <CardHeader class="pb-4">
              <div class="flex justify-between items-center">
                <CardTitle class="header-style">"Following" Leaderboard</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  @click="isAddFriendOpen = true"
                  class="ml-4"
                >
                  Follow User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                <div class="rounded-md border h-full">
                  <ScrollArea class="h-[calc(100dvh-220px)]">
                  <Table class="table-auto w-full">
                  <TableHeader>
                    <TableRow v-for="headerGroup in friendsTable.getHeaderGroups()" :key="headerGroup.id">
                      <TableHead v-for="header in headerGroup.headers" :key="header.id">
                        <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <template v-if="isLoadingFriends">
                      <TableRow v-for="i in skeletonRows" :key="'skeleton-' + i">
                        <TableCell>
                          <Skeleton class="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <div class="flex items-center gap-2">
                            <Skeleton class="h-9 w-9 rounded-full" />
                            <Skeleton class="h-4 w-[150px]" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div class="flex justify-center">
                            <Skeleton class="h-4 w-12" />
                          </div>
                        </TableCell>
                      </TableRow>
                    </template>
                    <template v-else-if="friendsTable.getRowModel().rows?.length">
                      <template v-for="row in friendsTable.getRowModel().rows" :key="row.id">
                        <TableRow>
                          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                            <FlexRender
                              :render="cell.column.columnDef.cell"
                              :props="cell.getContext()"
                            />
                          </TableCell>
                        </TableRow>
                      </template>
                    </template>
                    <TableRow v-else>
                      <TableCell :colspan="columns.length" class="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
    <!-- Mobile view: single card with dropdown selection in the title -->
    <div class="md:hidden">
      <div class="leaderboard-grid">
        <Card class="h-[calc(100dvh-100px)]">
          <CardHeader>
            <div class="flex justify-between items-center">
              <CardTitle class="header-style flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child class="relative flex items-center focus:outline-none">
                    <span class="flex items-center">
                      {{ selectedLeaderboard === 'global' ? 'Global Leaderboard' : '"Following" Leaderboard' }}
                      <ChevronDownIcon class="w-6 h-6 ml-1 stroke-2 transform transition-transform" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem @click="selectedLeaderboard = 'global'">Global Leaderboard</DropdownMenuItem>
                    <DropdownMenuItem @click="selectedLeaderboard = 'friends'">"Following" Leaderboard</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
              <Button 
                v-if="selectedLeaderboard === 'friends'"
                variant="outline" 
                size="sm"
                @click="isAddFriendOpen = true"
                class="ml-4"
              >
                Follow User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="rounded-md border h-full">
              <ScrollArea class="h-[calc(100dvh-220px)]">
                <Table class="table-auto w-full">
                  <TableHeader>
                    <TableRow v-for="headerGroup in selectedTable.getHeaderGroups()" :key="headerGroup.id">
                      <TableHead v-for="header in headerGroup.headers" :key="header.id">
                        <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <template v-if="selectedLeaderboard === 'global' ? isLoadingGlobal : isLoadingFriends">
                      <TableRow v-for="i in skeletonRows" :key="'skeleton-' + i">
                        <TableCell>
                          <Skeleton class="h-4 w-8" />
                        </TableCell>
                        <TableCell>
                          <div class="flex items-center gap-2">
                            <Skeleton class="h-9 w-9 rounded-full" />
                            <Skeleton class="h-4 w-[150px]" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div class="flex justify-center">
                            <Skeleton class="h-4 w-12" />
                          </div>
                        </TableCell>
                      </TableRow>
                    </template>
                    <template v-else-if="selectedTable.getRowModel().rows?.length">
                      <template v-for="row in selectedTable.getRowModel().rows" :key="row.id">
                        <TableRow>
                          <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                            <FlexRender
                              :render="cell.column.columnDef.cell"
                              :props="cell.getContext()"
                            />
                          </TableCell>
                        </TableRow>
                      </template>
                    </template>
                    <TableRow v-else>
                      <TableCell :colspan="columns.length" class="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Add the AddFriend component at the end of the template -->
    <AddFriend 
      v-model:open="isAddFriendOpen"
      @update:open="isAddFriendOpen = $event"
    />
</template>

<style scoped>
.table-container {
  max-width: 100%;
  overflow-x: hidden;
}

.header-style {
  font-size: x-large;
  font-weight: 500;
  padding: 0px;
  height: 50px;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .leaderboard-grid {
  display: grid;   
  width: 100%;
  height: 100%;
  margin: auto;
  padding: 2dvh;
  grid-template: 
  'm';
  grid-template-columns: auto;
  grid-template-rows: auto;
  gap: 1dvw;
  box-sizing: border-box;
}
}
</style>