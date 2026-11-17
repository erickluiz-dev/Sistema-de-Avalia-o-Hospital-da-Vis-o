import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, Users, Save, LoaderCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { apiFetch } from '../../../services/api'

type UserItem = { id:number; nome:string; login:string; administrador:boolean; funcao_id:number; funcao:string }
type Permission = { id:number; codigo:string; tema:string; nome:string; descricao:string; permitido:boolean; personalizado:boolean }
type Detail = UserItem & { permissoes:Permission[]; overrides:Record<string,boolean> }
type Role = { id:number; nome:string; codigo:string }

const roleOrder = ['Administrador','Atendente','Funcionário']

export default function PermissoesTab() {
  const [users,setUsers]=useState<UserItem[]>([])
  const [roles,setRoles]=useState<Role[]>([])
  const [selected,setSelected]=useState<Detail|null>(null)
  const [search,setSearch]=useState('')
  const [permissionSearch,setPermissionSearch]=useState('')
  const [values,setValues]=useState<Record<string,boolean>>({})
  const [roleId,setRoleId]=useState<number>(0)
  const [loading,setLoading]=useState(true)
  const [loadingDetail,setLoadingDetail]=useState(false)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')

  const load = useCallback(async()=>{
    setLoading(true);setError('')
    try {
      const [uRes,cRes]=await Promise.all([
        apiFetch('/admin/permissoes/usuarios'),
        apiFetch('/admin/permissoes/catalogo'),
      ])
      if(!uRes.ok||!cRes.ok) throw new Error('Não foi possível carregar usuários e funções.')
      const u=await uRes.json()
      const c=await cRes.json()
      setUsers(u)
      setRoles(c.roles ?? [])
    } catch(e){setError(e instanceof Error?e.message:'Erro ao carregar permissões.')}
    finally{setLoading(false)}
  },[])

  useEffect(()=>{void load()},[load])

  const openUser=async(user:UserItem)=>{
    setLoadingDetail(true);setError('')
    try{
      const response=await apiFetch(`/admin/permissoes/usuarios/${user.id}`)
      if(!response.ok) throw new Error((await response.text())||'Não foi possível abrir as permissões.')
      const detail:Detail=await response.json()
      setSelected(detail);setRoleId(detail.funcao_id)
      setValues(Object.fromEntries(detail.permissoes.map(p=>[p.codigo,p.permitido])))
    }catch(e){setError(e instanceof Error?e.message:'Erro ao carregar permissões.')}
    finally{setLoadingDetail(false)}
  }

  const grouped=useMemo(()=>users.filter(u=>`${u.nome} ${u.login}`.toLowerCase().includes(search.toLowerCase())).reduce<Record<string,UserItem[]>>((acc,u)=>{(acc[u.funcao]??=[]).push(u);return acc},{}),[users,search])
  const themes=useMemo(()=>Object.entries((selected?.permissoes??[]).filter(p=>`${p.nome} ${p.descricao} ${p.tema}`.toLowerCase().includes(permissionSearch.toLowerCase())).reduce<Record<string,Permission[]>>((acc,p)=>{(acc[p.tema]??=[]).push(p);return acc},{})),[selected,permissionSearch])
  const changes=selected ? selected.permissoes.filter(p=>values[p.codigo]!==p.permitido).length + (roleId!==selected.funcao_id?1:0) : 0

  const save=async()=>{
    if(!selected)return
    setSaving(true);setError('')
    try{
      const response=await apiFetch(`/admin/permissoes/usuarios/${selected.id}`,{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({funcao_id:roleId,permissoes:values}),
      })
      if(!response.ok) throw new Error((await response.text())||'Não foi possível salvar as permissões.')
      await load()
      await openUser({...selected,funcao_id:roleId,funcao:roles.find(r=>r.id===roleId)?.nome??selected.funcao})
    }catch(e){setError(e instanceof Error?e.message:'Erro ao salvar permissões.')}
    finally{setSaving(false)}
  }

  return <div className="flex min-h-[560px] min-w-0 flex-col gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-gray-900">Matriz de permissões</h2><p className="mt-1 text-sm text-gray-500">Selecione um usuário para configurar seus acessos por área.</p></div>
      <div className="flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-sm text-cyan-800"><ShieldCheck size={17}/>{users.length} usuários</div>
    </div>
    {error&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.7fr)]">
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-3"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"><Users size={16}/> Usuários por função</div><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar usuário..." className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-500"/></div></div>
        {loading?<div className="p-5 text-sm text-gray-500">Carregando usuários...</div>:roleOrder.map(role=><div key={role} className="border-b border-gray-100 last:border-0">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"><span>{role}</span><span>{grouped[role]?.length??0}</span></div>
          {(grouped[role]??[]).map(user=><button key={user.id} onClick={()=>void openUser(user)} className={`flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left transition-colors hover:bg-cyan-50 ${selected?.id===user.id?'border-cyan-600 bg-cyan-50':'border-transparent'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">{user.nome.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-gray-800">{user.nome}</span><span className="block truncate text-xs text-gray-500">{user.login}</span></span>{selected?.id===user.id?<ChevronDown size={16} className="text-cyan-700"/>:<ChevronRight size={16} className="text-gray-400"/>}</button>)}
        </div>)}
      </section>
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white">
        {!selected?<div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center"><ShieldCheck size={38} className="mb-3 text-gray-300"/><h3 className="font-semibold text-gray-700">Selecione um usuário</h3><p className="mt-1 max-w-sm text-sm text-gray-500">As permissões disponíveis serão exibidas aqui, separadas por tema.</p></div>:loadingDetail?<div className="flex min-h-[360px] items-center justify-center"><LoaderCircle className="animate-spin text-cyan-600"/></div>:<>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4"><div><h3 className="font-semibold text-gray-900">{selected.nome}</h3><p className="text-xs text-gray-500">{selected.login} · {selected.administrador?'Administrador protegido':'Permissões individuais'}</p></div><label className="text-xs text-gray-600">Função<select disabled={selected.administrador} value={roleId} onChange={e=>setRoleId(Number(e.target.value))} className="ml-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm disabled:opacity-60">{roles.filter(r => selected.administrador ? r.codigo === 'administrador' : r.codigo !== 'administrador').map(r=><option key={r.id} value={r.id}>{r.nome}</option>)}</select></label></div>
          <div className="border-b border-gray-100 p-3"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={permissionSearch} onChange={e=>setPermissionSearch(e.target.value)} placeholder="Buscar permissão..." className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-500"/></div></div>
          <div className="max-h-[520px] overflow-y-auto p-3">
            {themes.map(([theme,items])=><div key={theme} className="mb-4 overflow-hidden rounded-xl border border-gray-100 last:mb-0"><div className="bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">{theme}</div>{items.map(p=><label key={p.codigo} className="flex cursor-pointer items-start gap-3 border-t border-gray-100 px-3 py-3 hover:bg-gray-50"><input type="checkbox" checked={selected.administrador?true:!!values[p.codigo]} disabled={selected.administrador} onChange={e=>setValues(v=>({...v,[p.codigo]:e.target.checked}))} className="mt-0.5 h-4 w-4 accent-[#00A6B8] disabled:cursor-not-allowed"/><span className="min-w-0"><span className="block text-sm font-medium text-gray-800">{p.nome}</span><span className="block text-xs text-gray-500">{p.descricao}</span></span></label>)}</div>)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4"><span className="text-xs text-gray-500">{selected.administrador?'Administrador possui acesso total protegido.':`${changes} alteração(ões) pendente(s)`}</span><button onClick={()=>void save()} disabled={saving||selected.administrador||changes===0} className="inline-flex items-center gap-2 rounded-lg bg-[#009DB1] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00889A] disabled:cursor-not-allowed disabled:opacity-50">{saving?<LoaderCircle size={16} className="animate-spin"/>:<Save size={16}/>}Salvar permissões</button></div>
        </>}
      </section>
    </div>
  </div>
}
