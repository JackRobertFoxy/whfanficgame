# Follow-up lines only appear when earlier choices have actually been made.
D['dialogues']['sleeplessTalk'].insert(2,n('旁白','他想起刚才那碗汤。萨拉马斯记住了他喜欢的温度，离开床边以前还回头问过一遍。这样的细节在卡斯蒂安看来已经足够说明许多事，偏偏对方此刻的表情仿佛在等待一份完全不同的保证。',ifFlag='likesSanctuary'))
D['dialogues']['bedroomTalk'].insert(2,n('旁白','照片上的名字与预约纸已经一一看过，卡斯蒂安仍然没有因此记起那间警校。他只记住了可以确认的日期，并把不确定的部分留在沉默里。明天如果问到这里，他必须承认自己忘了，而不能随口填上旧世界的某一次出发。',condition='preludeComplete'))
D['dialogues']['assessmentTalk'].insert(3,n('旁白','电灯、电脑、医生。他先在心里重复了一遍，才把目光放到图片上。昨天练习过的称呼像一小段可以抓住的扶手，至少能使他不在第一个问题就被迫解释机魂是什么。',ifFlag='rehearsedTerms'))
D['dialogues']['nightTalk'].insert(2,n('旁白','他在走廊里数过这两天，又在提图斯的房间里听过两晚不同的水管声。现在约定终于快要结束，卡斯蒂安却仍然害怕自己听错了某一个时间。与其再猜，他宁可请提图斯直接拨出去。',ifFlag='countedDays'))
D['dialogues']['penthouseTalk'].insert(3,n('旁白','电话里说“会来”的那个人，现在就坐在沙发旁边伸手就能碰到他的地方。卡斯蒂安望着他，第一次发现等待也会留下这么明显的疲惫。好在那两天已经过去，他不用再把下一声来电当成一件需要反复祈求的事。',ifFlag='calledHim'))
D['dialogues']['studyTalk'].insert(3,n('旁白','卡斯蒂安认出了戒指。那晚萨拉马斯把它拿出来时，没有问太多，神情却一直没有松开。直到现在电脑上的日期亮起来，他才更清楚地知道，一件东西在对方眼里能够带回怎样的一整段生活，而自己只能从中学到一个新的数字。',ifFlag='learnedWords'))
D['dialogues']['finalTalk'].insert(5,n('旁白','这几天看见的东西终于有了各自的位置。那不是一条能把他送回照片里原主身边的路，也没有使旧世界的伤害失去分量；它只是让卡斯蒂安在这个短暂的晚上听清楚，门外那个人走近时，脚步的节奏属于现代公寓。',condition='allFragments'))
