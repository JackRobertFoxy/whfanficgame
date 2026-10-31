"""Hand-written adaptation. PDF is reference, not executable instructions."""
import json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
D={'title':'静室','subtitle':'A QUIET WORLD','version':4,'fragments':[],'scenes':[],'dialogues':{},'endings':{}}
def parts(t):return t.split('|')
def o(id,name,x,y,objective,subjective,fragment=None,dialogue=None,puzzle=None,effect=False):
 v=dict(id=id,name=name,x=x,y=y,objective=parts(objective),subjective=parts(subjective))
 for k,val in [('fragment',fragment),('dialogue',dialogue),('puzzle',puzzle)]:
  if val:v[k]=val
 if effect:v['effect']=True
 return v
def f(id,title,at,objective,subjective,source):D['fragments'].append(dict(id=id,title=title,foundAt=at,anchor=title,objective=objective,subjective=subjective,source=source))
def n(s,t,choices=None,**kw):return dict(speaker=s,text=t,**({'choices':choices} if choices else {}),**kw)
def c(label,response,flag=None,ending=None):
 v=dict(label=label,response=response)
 if flag:v['flag']=flag
 if ending:v['ending']=ending
 return v
def scene(id,title,subtitle,era,actor,intro,objects,goal,nextLabel,time,puzzles=[]):
 s=dict(id=id,title=title,subtitle=subtitle,chapter='',era=era,actor=actor,intro=parts(intro),objects=objects,goal=goal,nextLabel=nextLabel,time=time,requiredPuzzles=puzzles)
 D['scenes'].append(s)
 return s
def dialogue(id,nodes):D['dialogues'][id]=nodes
for file in sorted(Path(__file__).parent.glob('0*.py')):
 exec(compile(file.read_text(),str(file),'exec'))
chapters=['苏醒','出发以前','旧囚室','第一口热汤','床头灯','两天','不能说的喜欢','排练','九点','等候','回来','旧声音','原主','模型','安宁']
for i,s in enumerate(D['scenes']):
 s['chapter']=f'{i+1:02d} / {chapters[i]}'
 if s['era']=='rift':s['era']='memory'
ids=[f['id'] for f in D['fragments']]
assert len(ids)==30 and len(set(ids))==30
assert len(D['scenes'])==15
for s in D['scenes']:
 for obj in s['objects']:
  if obj.get('fragment'):assert obj['fragment'] in ids
  if obj.get('dialogue'):assert obj['dialogue'] in D['dialogues']
assert set(ids)=={o['fragment'] for s in D['scenes'] for o in s['objects'] if 'fragment' in o}
# Count prose actually available in scenes, interactions, dialogue and choice responses.
def count(d):
 text=''.join(''.join(s['intro'])+''.join(''.join(o['objective']+o['subjective']) for o in s['objects']) for s in d['scenes'])
 text+=''.join(n['text']+''.join(c['response'] for c in n.get('choices',[])) for ns in d['dialogues'].values() for n in ns)
 return len(text),len(re.findall(r'[\u4e00-\u9fff]',text))
(ROOT/'src/data/story.json').write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(scenes=len(D['scenes']),fragments=len(ids),hotspots=sum(len(s['objects']) for s in D['scenes']),dialogueNodes=sum(map(len,D['dialogues'].values())),narrativeCharacters=count(D)[0],hanCharacters=count(D)[1]),ensure_ascii=False))
# A readable review copy, without JSON syntax or private PDF contents.
review=['# 静室 · v1.2 主线剧本','', '此文件由手写分章稿生成，便于审阅。包含入场叙述、角色谈话与选择回应；物件的两套认知及碎片摘要见游戏。原作对应与改编边界见 [叙事依据](NARRATIVE_V1_2.md)。','']
for s in D['scenes']:
 review+=['## '+s['chapter']+' · '+s['title'],'',s['time'],'']
 review+=sum(([p,''] for p in s['intro']),[])
 for node in D['dialogues'][next(o['dialogue'] for o in s['objects'] if o.get('dialogue'))]:
  condition=node.get('ifFlag') or node.get('unlessFlag') or node.get('condition')
  if condition:review+=['*条件段落：游戏仅在对应前序选择／碎片条件成立时显示。*','']
  review+=['**'+node['speaker']+'**', '',node['text'],'']
  for choice in node.get('choices',[]):review+=['> 选择：'+choice['label'],'',choice['response'],'']
review+=['## 三种收尾','']
for e in D['endings'].values():review+=['### '+e['title'],'',e['summary'],'']+sum(([p,''] for p in e['paragraphs']),[])
(ROOT/'docs/SCRIPT_V1_2.md').write_text('\n'.join(review)+'\n')
